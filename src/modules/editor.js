/**
 * Editor Module
 * Handles text editing functionality including selection, rewriting, special characters, and auto-replacement
 */

(function () {
    const Editor = {
        regenerateContextChars: 8000,

        /**
         * Count words in text (strips HTML tags)
         * @param {string} text - Text to count words in
         * @returns {number} Word count
         */
        countWords(text) {
            if (!text) return 0;
            // Strip HTML tags for word counting
            const plainText = text.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
            return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
        },

        /**
         * Insert special character at cursor position in editor
         * @param {Object} app - Alpine app instance
         * @param {string} char - Character to insert
         */
        insertSpecialChar(app, char) {
            if (!app.currentScene) return;
            const textarea = document.querySelector('.editor-textarea');
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = app.currentScene.content || '';

            app.currentScene.content = text.substring(0, start) + char + text.substring(end);
            app.showSpecialChars = false;

            app.$nextTick(() => {
                textarea.focus();
                const newPos = start + char.length;
                textarea.setSelectionRange(newPos, newPos);
            });
        },

        /**
         * Handle auto-replacement of -- to em dash
         * @param {Object} app - Alpine app instance
         * @param {Event} event - Input event
         */
        handleAutoReplace(app, event) {
            if (!app.currentScene || !app.currentScene.content) return;

            const textarea = event.target;
            const cursorPos = textarea.selectionStart;
            const text = app.currentScene.content;

            // Check if we just typed a second hyphen
            if (text.substring(cursorPos - 2, cursorPos) === '--') {
                // Replace -- with em dash
                app.currentScene.content = text.substring(0, cursorPos - 2) + '—' + text.substring(cursorPos);

                app.$nextTick(() => {
                    const newPos = cursorPos - 1; // Move cursor after the em dash
                    textarea.setSelectionRange(newPos, newPos);
                });
            }
        },

        /**
         * Compute selection coordinates inside a textarea by mirroring styles into a hidden div
         * @param {HTMLTextAreaElement} textarea - The textarea element
         * @param {number} selectionIndex - Selection position
         * @returns {Object|null} Coordinates {left, top, height, right} or null
         */
        getTextareaSelectionCoords(textarea, selectionIndex) {
            try {
                const rect = textarea.getBoundingClientRect();

                // Don't show button if textarea is not visible
                if (rect.width === 0 || rect.height === 0) {
                    return null;
                }

                // Create mirror div placed at the textarea's position
                const div = document.createElement('div');
                const style = window.getComputedStyle(textarea);
                // Copy relevant textarea styles
                div.style.position = 'absolute';
                div.style.visibility = 'hidden';
                div.style.whiteSpace = 'pre-wrap';
                div.style.wordWrap = 'break-word';
                div.style.overflow = 'hidden';
                div.style.boxSizing = 'border-box';
                div.style.width = rect.width + 'px';
                div.style.left = rect.left + window.scrollX + 'px';
                div.style.top = rect.top + window.scrollY + 'px';
                div.style.font = style.font || `${style.fontSize} ${style.fontFamily}`;
                div.style.fontSize = style.fontSize;
                div.style.lineHeight = style.lineHeight;
                div.style.padding = style.padding;
                div.style.border = style.border;
                div.style.letterSpacing = style.letterSpacing;
                div.style.whiteSpace = 'pre-wrap';

                const text = textarea.value.substring(0, selectionIndex);
                // Replace trailing spaces with nbsp so measurement matches
                const safe = text.replace(/\n$/g, '\n\u200b');
                div.textContent = safe;

                const span = document.createElement('span');
                span.textContent = textarea.value.substring(selectionIndex, selectionIndex + 1) || '\u200b';
                div.appendChild(span);

                document.body.appendChild(div);
                const spanRect = span.getBoundingClientRect();
                const coords = { left: spanRect.left, top: spanRect.top, height: spanRect.height, right: spanRect.right };
                document.body.removeChild(div);

                return coords;
            } catch (e) {
                return null;
            }
        },

        /**
         * Handle clicks on the floating Rewrite button: open modal with selected text
         * @param {Object} app - Alpine app instance
         */
        handleRewriteButtonClick(app) {
            try {
                // For textarea, use stored selection indices
                const editor = document.querySelector('.editor-textarea');
                if (editor && editor.tagName === 'TEXTAREA') {
                    app.rewriteOriginalText = app.selectedTextForRewrite || '';
                    // Keep the selection indices for later replacement
                } else {
                    // Fallback for contenteditable (if ever used)
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                        app.rewriteSelectionRange = selection.getRangeAt(0).cloneRange();
                        app.rewriteOriginalText = selection.toString();
                    } else {
                        app.rewriteOriginalText = app.selectedTextForRewrite || '';
                        app.rewriteSelectionRange = null;
                    }
                }
                app.rewriteOutput = '';
                app.rewritePromptPreview = '';
                app.rewriteInProgress = false;
                app.showRewriteModal = true;
                app.showRewriteBtn = false;
            } catch (e) {
                console.error('handleRewriteButtonClick error', e);
            }
        },

        /**
         * Build the prompt for rewriting selected text
         * @param {Object} app - Alpine app instance
         * @returns {string} The rewrite prompt
         */
        buildRewritePrompt(app) {
            try {
                // Show the rewrite prompt list for selection
                app.showRewritePromptList = true;

                // If a rewrite prompt is selected, use it
                let rewritePrompt = '';
                if (app.selectedRewritePromptId) {
                    const selected = app.prompts.find(p => p.id === app.selectedRewritePromptId);
                    if (selected && selected.content) {
                        rewritePrompt = selected.content;
                    }
                }

                // Build the full prompt
                let prompt = rewritePrompt || 'Rewrite the following passage to be more vivid and polished while preserving its meaning and details. Keep roughly the same length.';
                prompt += '\n\nORIGINAL TEXT:\n' + app.rewriteOriginalText + '\n\nREWRITTEN TEXT:';
                app.rewritePromptPreview = prompt;
                return prompt;
            } catch (e) {
                console.error('buildRewritePrompt error', e);
                return 'Rewrite the following text:\n\n' + app.rewriteOriginalText;
            }
        },

        /**
         * Perform the rewrite operation using AI
         * @param {Object} app - Alpine app instance
         */
        async performRewrite(app) {
            try {
                if (!app.rewriteOriginalText) return;
                if (!window.Generation || typeof window.Generation.streamGeneration !== 'function') {
                    throw new Error('Generation not available');
                }
                app.rewriteOutput = '';
                app.rewriteInProgress = true;
                const prompt = this.buildRewritePrompt(app);
                const result = await window.Generation.streamGeneration(prompt, (token) => {
                    app.rewriteOutput += token;
                }, app);
                app.rewriteInProgress = false;

                // Notify user if response was truncated
                if (result?.finishReason === 'length' || result?.finishReason === 'MAX_TOKENS') {
                    console.warn('⚠️ Rewrite hit token limit');
                    alert('⚠️ The generation reached the token limit and may be incomplete.\n\nTip: Increase "Max Length" in AI Settings (⚙️) for longer responses.');
                }
            } catch (e) {
                console.error('performRewrite error', e);
                app.rewriteInProgress = false;
                alert('Rewrite failed: ' + (e && e.message ? e.message : e));
            }
        },

        /**
         * Accept the rewritten text and replace the original
         * @param {Object} app - Alpine app instance
         */
        async acceptRewrite(app) {
            try {
                if (!app.currentScene || !app.rewriteOutput) return;

                const editor = document.querySelector('.editor-textarea');
                if (editor && editor.tagName === 'TEXTAREA') {
                    // Replace text in textarea using stored selection indices
                    if (app.rewriteTextareaStart !== null && app.rewriteTextareaEnd !== null) {
                        const before = app.currentScene.content.substring(0, app.rewriteTextareaStart);
                        const after = app.currentScene.content.substring(app.rewriteTextareaEnd);
                        app.currentScene.content = before + app.rewriteOutput + after;

                        // Save the scene
                        await app.saveScene();
                    }
                } else if (app.rewriteSelectionRange) {
                    // Fallback for contenteditable (if ever used)
                    const contentEditor = document.querySelector('.editor-textarea[contenteditable="true"]');
                    if (contentEditor) {
                        // Delete the selected content and insert the new text
                        app.rewriteSelectionRange.deleteContents();
                        const textNode = document.createTextNode(app.rewriteOutput);
                        app.rewriteSelectionRange.insertNode(textNode);

                        // Trigger the input event to save the change
                        const event = new Event('input', { bubbles: true });
                        contentEditor.dispatchEvent(event);
                    }
                }

                app.showRewriteModal = false;
                app.rewriteOriginalText = '';
                app.rewriteOutput = '';
                app.rewriteSelectionRange = null;
                app.rewriteTextareaStart = null;
                app.rewriteTextareaEnd = null;
            } catch (e) {
                console.error('acceptRewrite error', e);
            }
        },

        /**
         * Retry the rewrite operation
         * @param {Object} app - Alpine app instance
         */
        retryRewrite(app) {
            app.rewriteOutput = '';
            this.performRewrite(app);
        },

        /**
         * Discard the rewrite and close the modal
         * @param {Object} app - Alpine app instance
         */
        discardRewrite(app) {
            app.showRewriteModal = false;
            app.showRewritePromptList = false;
            app.selectedRewritePromptId = null;
            app.rewriteOriginalText = '';
            app.rewriteOutput = '';
            app.rewritePromptPreview = '';
            app.rewriteTextareaStart = null;
            app.rewriteTextareaEnd = null;
        },

        /**
         * Open the selection regeneration modal with a wide scene-local context window.
         * @param {Object} app - Alpine app instance
         */
        handleRegenerateSelectionButtonClick(app) {
            try {
                if (!app.currentScene) return;
                const content = app.currentScene.content || '';
                const start = app.rewriteTextareaStart;
                const end = app.rewriteTextareaEnd;

                if (start === null || end === null || start >= end) {
                    alert('Select text in the editor before regenerating a passage.');
                    return;
                }

                const originalText = content.substring(start, end);
                if (!originalText.trim()) {
                    alert('Select non-empty text in the editor before regenerating a passage.');
                    return;
                }

                const contextSize = this.regenerateContextChars;
                app.regenerateSelectionTextareaStart = start;
                app.regenerateSelectionTextareaEnd = end;
                app.regenerateSelectionOriginalText = originalText;
                app.regenerateSelectionContextBefore = content.substring(Math.max(0, start - contextSize), start);
                app.regenerateSelectionContextAfter = content.substring(end, Math.min(content.length, end + contextSize));
                app.regenerateSelectionOutput = '';
                app.regenerateSelectionInstruction = '';
                app.regenerateSelectionUseContext = true;
                app.regenerateSelectionInProgress = false;
                app.lastReasoningText = '';
                app.reasoningInProgress = false;
                app.showReasoningModal = false;
                app.showRegenerateSelectionModal = true;
                app.showRewriteBtn = false;
            } catch (e) {
                console.error('handleRegenerateSelectionButtonClick error', e);
            }
        },

        /**
         * Build a prompt that asks the model to replace only the selected passage.
         * @param {Object} app - Alpine app instance
         * @returns {Object} Prompt object compatible with Generation.streamGeneration
         */
        buildRegenerateSelectionPrompt(app, proseInfo) {
            const povName = (app.povCharacter && app.povCharacter.trim()) ? app.povCharacter.trim() : 'the protagonist';
            const tenseText = app.tense === 'present' ? 'present tense' : 'past tense';
            const povText = app.pov || '3rd person limited';
            const userInstruction = (app.regenerateSelectionInstruction || '').trim();
            const prosePrompt = (proseInfo && proseInfo.text) ? proseInfo.text.trim() : '';
            const systemPrompt = (proseInfo && proseInfo.systemText)
                ? proseInfo.systemText.trim()
                : `You are a fiction co-writing assistant. Write from ${povName}'s point of view, in ${tenseText}, using ${povText}. Match the language, tone, continuity, pacing, and style of the surrounding scene.`;

            const userParts = [
                'Regenerate only the selected passage from a fiction scene.',
                'Use the BEFORE and AFTER context to preserve continuity.',
                'Return only the replacement prose for SELECTED PASSAGE.',
                'Do not include analysis, labels, markdown fences, the BEFORE context, or the AFTER context.',
                'The replacement should fit naturally between BEFORE and AFTER.'
            ];

            if (prosePrompt) {
                userParts.push('\nPROJECT PROSE INSTRUCTIONS:\n' + prosePrompt);
            }

            if (userInstruction) {
                userParts.push('\nUSER REGENERATION INSTRUCTIONS:\n' + userInstruction);
            }

            userParts.push(
                app.regenerateSelectionUseContext
                    ? '\nBEFORE CONTEXT:\n' + (app.regenerateSelectionContextBefore || '[start of scene]')
                    : '\nBEFORE CONTEXT:\n[not provided by user choice]',
                '\nSELECTED PASSAGE TO REPLACE:\n' + app.regenerateSelectionOriginalText,
                app.regenerateSelectionUseContext
                    ? '\nAFTER CONTEXT:\n' + (app.regenerateSelectionContextAfter || '[end of scene]')
                    : '\nAFTER CONTEXT:\n[not provided by user choice]',
                '\nREPLACEMENT PASSAGE:'
            );

            const userContent = userParts.join('\n');
            return {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userContent }
                ],
                asString: function () {
                    return `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${userContent}<|im_end|>\n<|im_start|>assistant\n`;
                }
            };
        },

        /**
         * Generate a replacement for the selected passage.
         * @param {Object} app - Alpine app instance
         */
        async performRegenerateSelection(app) {
            try {
                if (!app.regenerateSelectionOriginalText) return;
                if (!window.Generation || typeof window.Generation.streamGeneration !== 'function') {
                    throw new Error('Generation not available');
                }

                app.regenerateSelectionOutput = '';
                app.lastReasoningText = '';
                app.reasoningInProgress = false;
                app.showReasoningModal = false;
                app.regenerateSelectionInProgress = true;
                app.generationAbortController = typeof AbortController !== 'undefined' ? new AbortController() : null;

                const proseInfo = typeof app.resolveProsePromptInfo === 'function'
                    ? await app.resolveProsePromptInfo()
                    : null;
                const prompt = this.buildRegenerateSelectionPrompt(app, proseInfo);
                const result = await window.Generation.streamGeneration(prompt, (token) => {
                    app.regenerateSelectionOutput += token;
                }, app);

                if (result?.finishReason === 'length' || result?.finishReason === 'MAX_TOKENS') {
                    alert('The replacement reached the token limit and may be incomplete. Increase Max Length in AI Settings for longer passages.');
                }
            } catch (e) {
                if (!(e && (e.name === 'AbortError' || String(e.message || '').toLowerCase().includes('aborted')))) {
                    console.error('performRegenerateSelection error', e);
                    alert('Selection regeneration failed: ' + (e && e.message ? e.message : e));
                }
            } finally {
                app.regenerateSelectionInProgress = false;
                app.reasoningInProgress = false;
                app.generationAbortController = null;
            }
        },

        /**
         * Accept generated replacement after verifying the original selection did not move.
         * @param {Object} app - Alpine app instance
         */
        async acceptRegenerateSelection(app) {
            try {
                if (!app.currentScene || !app.regenerateSelectionOutput) return;
                const start = app.regenerateSelectionTextareaStart;
                const end = app.regenerateSelectionTextareaEnd;
                const content = app.currentScene.content || '';

                if (start === null || end === null || start >= end) return;

                const currentSelectedText = content.substring(start, end);
                if (currentSelectedText !== app.regenerateSelectionOriginalText) {
                    alert('The scene changed while the replacement was being generated, so Writingway cannot safely replace the original selection. Re-select the passage and try again.');
                    return;
                }

                const replacement = app.regenerateSelectionOutput.trim();
                app.currentScene.content = content.substring(0, start) + replacement + content.substring(end);
                await app.saveScene();
                app.showRegenerateSelectionModal = false;

                app.$nextTick(() => {
                    const textarea = document.querySelector('.editor-textarea');
                    if (textarea) {
                        textarea.focus();
                        textarea.setSelectionRange(start, start + replacement.length);
                    }
                });

                this.clearRegenerateSelectionState(app);
            } catch (e) {
                console.error('acceptRegenerateSelection error', e);
            }
        },

        retryRegenerateSelection(app) {
            app.regenerateSelectionOutput = '';
            this.performRegenerateSelection(app);
        },

        discardRegenerateSelection(app) {
            app.showRegenerateSelectionModal = false;
            this.clearRegenerateSelectionState(app);
        },

        clearRegenerateSelectionState(app) {
            app.regenerateSelectionOriginalText = '';
            app.regenerateSelectionOutput = '';
            app.regenerateSelectionInstruction = '';
            app.regenerateSelectionUseContext = true;
            app.regenerateSelectionInProgress = false;
            app.regenerateSelectionTextareaStart = null;
            app.regenerateSelectionTextareaEnd = null;
            app.regenerateSelectionContextBefore = '';
            app.regenerateSelectionContextAfter = '';
        }
    };

    // Expose globally for Alpine.js
    window.Editor = Editor;
})();
