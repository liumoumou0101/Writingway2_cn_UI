(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WritingwayPromptBuilder = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function cleanBeat(beat) {
        return String(beat || '')
            .replace(/@\[([^\]]+)\]/g, '')
            .replace(/#\[([^\]]+)\]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function messagesToChatML(messages) {
        if (!Array.isArray(messages)) return '';
        let result = '';
        for (const message of messages) {
            result += `<|im_start|>${message.role}\n${message.content}<|im_end|>\n`;
        }
        return `${result}<|im_start|>assistant\n`;
    }

    function promptObject(messages, meta = {}) {
        return {
            messages,
            meta,
            asString() {
                return messagesToChatML(messages);
            }
        };
    }

    function buildFictionPrompt(input = {}) {
        const beat = input.beat || '';
        const sceneContext = input.sceneContext || '';
        const options = input.options || {};
        const povName = options.povCharacter && String(options.povCharacter).trim()
            ? String(options.povCharacter).trim()
            : 'the protagonist';
        const tenseText = options.tense === 'present' ? 'present tense' : 'past tense';
        const povText = options.pov || '3rd person limited';
        const povSentence = `You are a co-author helping continue a story from the point of view of ${povName}, in ${tenseText}, using ${povText}.`;

        const systemPrompt = options.systemPrompt && String(options.systemPrompt).trim()
            ? String(options.systemPrompt).trim()
                .replace(/\{povName\}/gi, povName)
                .replace(/\{tense\}/gi, tenseText)
                .replace(/\{pov\}/gi, povText)
            : `${povSentence} Use the same language as the author's beat and surrounding scene text unless the author explicitly requests another language. If the author writes in Chinese, write in Chinese. If the author writes in English, write in English. Expand the beat into vivid, natural prose. Match the author's tone and style, use sensory details, and show rather than explain.`;

        let userContent = '';
        if (sceneContext) {
            userContent += `\n\nCURRENT SCENE SO FAR:\n${sceneContext}`;
        }

        if (options.prosePrompt && String(options.prosePrompt).trim()) {
            userContent += options.preview
                ? `\n\n${String(options.prosePrompt).trim()}`
                : `\n\n--- PROMPT TEMPLATE START ---\n${String(options.prosePrompt).trim()}\n--- PROMPT TEMPLATE END ---`;
        }

        if (Array.isArray(options.compendiumEntries) && options.compendiumEntries.length) {
            userContent += '\n\nCOMPENDIUM REFERENCES:\n';
            for (const entry of options.compendiumEntries) {
                const title = entry.title || `entry ${entry.id || ''}`;
                const body = entry.body || entry.content || entry.description || '';
                userContent += `\n-- ${title} --\n${body}\n`;
                if (entry.type === 'character' && entry.characterProfile) {
                    const profile = entry.characterProfile;
                    const fields = [];
                    if (profile.role) fields.push(`角色定位: ${profile.role}`);
                    if (profile.goal) fields.push(`目标: ${profile.goal}`);
                    if (profile.motivation) fields.push(`动机: ${profile.motivation}`);
                    if (profile.conflict) fields.push(`冲突: ${profile.conflict}`);
                    if (profile.voice) fields.push(`语气/声音: ${profile.voice}`);
                    if (profile.currentState) fields.push(`当前状态: ${profile.currentState}`);
                    if (profile.knowledge) fields.push(`已知信息: ${profile.knowledge}`);
                    if (profile.relationshipNotes) fields.push(`关系备注: ${profile.relationshipNotes}`);
                    if (fields.length) {
                        userContent += `[${title} 结构化约束]\n${fields.join('\n')}\n`;
                    }
                }
            }
        }

        if (Array.isArray(options.sceneSummaries) && options.sceneSummaries.length) {
            userContent += '\n\nPREVIOUS SCENES:\n';
            for (const scene of options.sceneSummaries) {
                if (!scene.summary) continue;
                userContent += `\n-- ${scene.title || 'Untitled Scene'} --\n${scene.summary}\n`;
            }
        }

        userContent += `\n\nBEAT TO EXPAND:\n${cleanBeat(beat)}\n\nContinue in the same language as the beat. Write the next 2-3 paragraphs:`;

        return promptObject([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
        ], {
            task: 'fiction-prose',
            beat: cleanBeat(beat),
            povCharacter: povName,
            pov: povText,
            tense: tenseText
        });
    }

    return {
        cleanBeat,
        messagesToChatML,
        promptObject,
        buildFictionPrompt
    };
});

