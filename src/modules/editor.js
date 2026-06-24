/**
 * Editor Module
 * Handles text editing functionality including selection, rewriting, special characters, and auto-replacement
 */

(function () {
    const REWRITE_PRESETS = [
        {
            id: 'balanced-polish',
            title: '均衡润色',
            description: '提升流畅度、画面感和完成度，不明显改变原意。',
            prompt: '请重写选中文段，使语言更自然、流畅、有画面感，同时保留原意、事实信息、人物关系和叙事视角。不要扩写过多，长度尽量接近原文。'
        },
        {
            id: 'tighten',
            title: '压缩精炼',
            description: '删掉松散重复的表达，让句子更利落。',
            prompt: '请压缩并精炼选中文段，删去重复、拖沓、解释过度的句子，让表达更干净有力。保留关键动作、信息和情绪，长度约为原文的 60%-80%。'
        },
        {
            id: 'expand',
            title: '适度扩写',
            description: '在不跑题的前提下补足动作、情绪和场景细节。',
            prompt: '请适度扩写选中文段，补足必要的动作衔接、心理反应、环境细节和节奏停顿。不要改变剧情走向和人物意图，长度约为原文的 1.3-1.8 倍。'
        },
        {
            id: 'show-dont-tell',
            title: '少解释多呈现',
            description: '把直白说明改成动作、细节和反应。',
            prompt: '请把选中文段中直白说明、总结性描述和情绪标签，改写成具体动作、感官细节、人物反应和可观察的场景表现。保留原本要表达的情绪和信息。'
        },
        {
            id: 'sensory',
            title: '增强感官',
            description: '强化视觉、声音、触感、气味和空间感。',
            prompt: '请重写选中文段，增强感官描写和空间感，优先使用视觉、声音、触感、气味或温度等细节，让场景更可感。不要堆砌形容词，不要偏离原剧情。'
        },
        {
            id: 'tension',
            title: '提高紧张感',
            description: '让冲突、危险或不安更明显。',
            prompt: '请重写选中文段，提高紧张感和压迫感。加强动作节奏、停顿、未知感、人物警觉或危险暗示。保持原事件不变，不要提前揭示答案。'
        },
        {
            id: 'pace-fast',
            title: '加快节奏',
            description: '适合动作、追逐、争执、关键转折。',
            prompt: '请重写选中文段，让节奏更快、更利落。减少解释和内心独白，使用更短的句子、更清晰的动作链和更直接的冲突推进。'
        },
        {
            id: 'pace-slow',
            title: '放慢节奏',
            description: '适合重要情绪、悬念、氛围和转场。',
            prompt: '请重写选中文段，放慢叙事节奏，增加停顿、观察、细微动作和情绪层次。让读者更充分地感受到这一刻的重要性，但不要重复啰嗦。'
        },
        {
            id: 'dialogue-natural',
            title: '对白自然化',
            description: '让台词更像真人说话，同时保留信息。',
            prompt: '请重写选中文段中的对白，让台词更自然、有角色感，减少书面腔和信息直给。保留原本要传达的信息，并加入适量动作或停顿来承载潜台词。'
        },
        {
            id: 'subtext',
            title: '增加潜台词',
            description: '让人物不把话说满，情绪藏在动作里。',
            prompt: '请重写选中文段，增加潜台词。让人物少直接说出真实想法，把矛盾、犹豫、亲近或敌意藏在措辞、停顿、动作和反应里。不要改变人物立场。'
        },
        {
            id: 'emotion-deeper',
            title: '加深情绪',
            description: '强化人物内在波动，但避免煽情。',
            prompt: '请重写选中文段，加深人物情绪层次。通过身体反应、记忆闪回、细微动作或自我克制来表现情绪，不要直接堆砌“悲伤、愤怒、害怕”等标签。'
        },
        {
            id: 'character-voice',
            title: '强化角色声音',
            description: '让叙述和台词更贴合该人物。',
            prompt: '请重写选中文段，让语言更贴合当前视角人物的性格、身份、年龄、经验和情绪状态。保留原信息，但调整用词、观察重点和反应方式，使角色声音更鲜明。'
        },
        {
            id: 'literary',
            title: '文学化',
            description: '更细腻、更凝练、更有余韵。',
            prompt: '请将选中文段重写得更文学化：语言更凝练，意象更准确，节奏更有余韵。避免华丽堆砌和空泛比喻，保持叙事清晰。'
        },
        {
            id: 'webnovel',
            title: '网文爽感',
            description: '更直接、更抓人，更适合连载阅读。',
            prompt: '请将选中文段重写得更适合中文网文连载：节奏明确，情绪更外放，冲突更清楚，句子更有推进力。保留原剧情，不要过度中二或夸张。'
        },
        {
            id: 'cinematic',
            title: '电影镜头感',
            description: '像镜头一样组织动作、视线和画面。',
            prompt: '请重写选中文段，增强电影镜头感。用清晰的画面调度、动作顺序、视线移动和环境反应来呈现场景。避免解释镜头术语，直接写成小说正文。'
        },
        {
            id: 'clarity',
            title: '理清逻辑',
            description: '修正语序、指代、因果和动作衔接。',
            prompt: '请重写选中文段，重点理清句子逻辑、人物指代、动作先后和因果关系。不要改变剧情，只让读者更容易理解正在发生什么。'
        },
        {
            id: 'continuity',
            title: '贴合上下文',
            description: '让选段更像自然接在前后文里。',
            prompt: '请重写选中文段，让它更自然地衔接上下文。注意代词、时间、动作连续性、情绪延续和叙述视角一致性。不要引入新的设定或剧情。'
        },
        {
            id: 'remove-cliche',
            title: '去套路化',
            description: '替换陈词滥调和过熟表达。',
            prompt: '请重写选中文段，去掉陈词滥调、套路化形容和常见套话，换成更具体、更贴合当前场景和人物的表达。保持自然，不要刻意炫技。'
        },
        {
            id: 'grammar-copyedit',
            title: '校对修正',
            description: '只修病句、错字、标点和轻微不顺。',
            prompt: '请只对选中文段做校对级修改：修正错别字、病句、标点、重复和明显不顺的表达。尽量保留原句结构、风格和长度，不要主动扩写或改剧情。'
        },
        {
            id: 'same-meaning-alt',
            title: '换一种写法',
            description: '保留含义，换更顺的表达。',
            prompt: '请在不改变原意、不增删剧情信息的前提下，把选中文段换一种更自然、更有可读性的写法。长度接近原文。'
        }
    ];

    const Editor = {
        rewritePresets: REWRITE_PRESETS,

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
                app.selectedRewritePresetId = app.selectedRewritePresetId || 'balanced-polish';
                if (!app.rewriteInstruction) {
                    this.applyRewritePreset(app);
                }
                app.showRewriteModal = true;
                app.showRewriteBtn = false;
            } catch (e) {
                console.error('handleRewriteButtonClick error', e);
            }
        },

        getRewritePresets() {
            return REWRITE_PRESETS;
        },

        applyRewritePreset(app) {
            try {
                const preset = REWRITE_PRESETS.find(item => item.id === app.selectedRewritePresetId);
                if (!preset) return;
                app.selectedRewritePromptId = null;
                app.rewriteInstruction = preset.prompt;
                app.rewritePromptPreview = '';
            } catch (e) {
                console.error('applyRewritePreset error', e);
            }
        },

        applySavedRewritePrompt(app) {
            try {
                if (!app.selectedRewritePromptId) return;
                const selected = (app.prompts || []).find(p => p.id === app.selectedRewritePromptId);
                if (selected && selected.content) {
                    app.selectedRewritePresetId = '';
                    app.rewriteInstruction = selected.content;
                    app.rewritePromptPreview = '';
                }
            } catch (e) {
                console.error('applySavedRewritePrompt error', e);
            }
        },

        /**
         * Build the prompt for rewriting selected text
         * @param {Object} app - Alpine app instance
         * @returns {string} The rewrite prompt
         */
        buildRewritePrompt(app) {
            try {
                const instruction = (app.rewriteInstruction || '').trim()
                    || '请重写选中文段，使语言更自然、流畅、有画面感，同时保留原意、事实信息、人物关系和叙事视角。不要扩写过多，长度尽量接近原文。';
                let prompt = instruction;
                prompt += '\n\n要求：只输出重写后的正文，不要解释修改思路，不要添加标题，不要使用列表。';
                prompt += '\n\n原文：\n' + app.rewriteOriginalText + '\n\n重写后：';
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
                app.rewriteInstruction = '';
                app.selectedRewritePresetId = 'balanced-polish';
                app.selectedRewritePromptId = null;
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
            app.selectedRewritePromptId = null;
            app.selectedRewritePresetId = 'balanced-polish';
            app.rewriteOriginalText = '';
            app.rewriteOutput = '';
            app.rewriteInstruction = '';
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
