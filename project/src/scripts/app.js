import { useEffect, useMemo, useRef, useState } from 'react';
import { html } from 'htm/react';
import { tokenize, completion, abortCompletion } from './endpoints.js';
import { InputBox, SelectBox, Checkbox } from './components.js'

const defaultPrompt = `[INST] <<SYS>>
You are a talented writing assistant. Always respond by incorporating the instructions into expertly written prose that is highly detailed, evocative, vivid and engaging.
<</SYS>>

Write a story about Hatsune Miku and Kagamine Rin. [/INST]  Sure, how about this:

Chapter 1
`;

function joinPrompt(prompt) {
	return prompt.map(p => p.content).join('');
}

function replaceUnprintableBytes(inputString) {
  // Define a regular expression to match unprintable bytes
  const unprintableBytesRegex = /[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g;

  // Replace unprintable bytes with their character codes
  const replacedString = inputString.replace(unprintableBytesRegex, (match) => {
    const charCode = match.charCodeAt(0);
    return `<0x${charCode.toString(16).toUpperCase().padStart(2, '0')}>`;
  });

  return replacedString;
}

function usePersistentState(name, initialState) {
	let savedState;
	try {
		savedState = useMemo(() => JSON.parse(localStorage.getItem(name)), []);
	} catch {
		savedState = null;
	}
	const [value, setValue] = useState(savedState || initialState);
	return [value, (newValue) => {
		if (typeof newValue === 'function') {
			setValue(v => {
				newValue = newValue(v);
				localStorage.setItem(name, JSON.stringify(newValue));
				return newValue;
			});
		} else {
			localStorage.setItem(name, JSON.stringify(newValue));
			setValue(newValue);
		}
	}]
}

function resetPersistence() {
	localStorage.clear();
	location.reload();
}

export function App() {
	const promptArea = useRef();
	const promptOverlay = useRef();
	const undoStack = useRef([]);
	const probsDelayTimer = useRef();
	const switchCompletionDelayTimer = useRef();
	const [currentPromptChunk, setCurrentPromptChunk] = useState(undefined);
	const [undoHovered, setUndoHovered] = useState(false);
	const [showProbs, setShowProbs] = useState(true);
	const [cancel, setCancel] = useState(null);
	const [darkMode, setDarkMode] = usePersistentState('darkMode', false);
	const [endpoint, setEndpoint] = usePersistentState('endpoint', 'http://localhost:8080');
	const [endpointAPI, setEndpointAPI] = usePersistentState('endpointAPI', 0);
	const [promptChunks, setPromptChunks] = usePersistentState('prompt', [{ type: 'user', content: defaultPrompt }]);
	const [seed, setSeed] = usePersistentState('seed', -1);
	const [maxPredictTokens, setMaxPredictTokens] = usePersistentState('maxPredictTokens', -1);
	const [temperature, setTemperature] = usePersistentState('temperature', 0.7); // llama.cpp default 0.8
	const [repeatPenalty, setRepeatPenalty] = usePersistentState('repeatPenalty', 1.1);
	const [repeatLastN, setRepeatLastN] = usePersistentState('repeatLastN', 256); // llama.cpp default 64
	const [penalizeNl, setPenalizeNl] = usePersistentState('penalizeNl', true);
	const [presencePenalty, setPresencePenalty] = usePersistentState('presencePenalty', 0);
	const [frequencyPenalty, setFrequencyPenalty] = usePersistentState('frequencyPenalty', 0);
	const [topK, setTopK] = usePersistentState('topK', 40);
	const [topP, setTopP] = usePersistentState('topP', 0.95);
	const [typicalP, setTypicalP] = usePersistentState('typicalP', 1);
	const [tfsZ, setTfsZ] = usePersistentState('tfsZ', 1);
	const [mirostat, setMirostat] = usePersistentState('mirostat', 2); // llama.cpp default 0
	const [mirostatTau, setMirostatTau] = usePersistentState('mirostatTau', 5.0);
	const [mirostatEta, setMirostatEta] = usePersistentState('mirostatEta', 0.1);
	const [ignoreEos, setIgnoreEos] = usePersistentState('ignoreEos', false);
	const [tokens, setTokens] = useState(0);

	const promptText = useMemo(() => joinPrompt(promptChunks), [promptChunks]);

	// Update dark mode on the first render.
	useMemo(() => !darkMode || switchDarkMode(darkMode, true), []);

	async function predict(prompt = promptText, chunkCount = promptChunks.length) {
		const ac = new AbortController();
		const cancel = () => {
			abortCompletion({ endpoint, endpointAPI });
			ac.abort();
		};
		setCancel(() => cancel);
		try {
			const { tokens } = await tokenize({
				endpoint,
				endpointAPI,
				content: ` ${prompt}`,
				signal: ac.signal,
			});
			setTokens(tokens.length + 1);
			while (undoStack.current.at(-1) >= chunkCount)
				undoStack.current.pop();
			undoStack.current.push(chunkCount);
			setUndoHovered(false);

			for await (const chunk of completion({
				endpoint,
				endpointAPI,
				prompt,
				seed,
				temperature,
				repeat_penalty: repeatPenalty,
				repeat_last_n: repeatLastN,
				penalize_nl: penalizeNl,
				presence_penalty: presencePenalty,
				frequency_penalty: frequencyPenalty,
				mirostat,
				...(mirostat ? {
					mirostat_tau: mirostatTau,
					mirostat_eta: mirostatEta,
				} : {
					top_k: topK,
					top_p: topP,
					typical_p: typicalP,
					tfs_z: tfsZ,
				}),
				ignore_eos: ignoreEos,
				n_predict: maxPredictTokens,
				n_probs: 10,
				signal: ac.signal,
			})) {
				ac.signal.throwIfAborted();
				if (!chunk.content)
					continue;
				setPromptChunks(p => [...p, chunk]);
				setTokens(t => t + (chunk?.completion_probabilities?.length ?? 1));
				chunkCount += 1;
			}
		} catch (e) {
			if (e.name !== 'AbortError')
				reportError(e);
		} finally {
			setCancel(c => c === cancel ? null : c);
			if (undoStack.current.at(-1) === chunkCount)
				undoStack.current.pop();
		}
	}

	function undo() {
		if (!undoStack.current.length)
			return;
		setPromptChunks(p => p.slice(0, undoStack.current.pop()));
	}

	// Update the textarea in an uncontrolled way so the user doesn't lose their
	// selection or cursor position during prediction
	useEffect(() => {
		const elem = promptArea.current;
		if (elem.value === promptText) {
			return;
		} else if (promptText.startsWith(elem.value)) {
			const oldHeight = elem.scrollHeight;
			const atBottom = elem.scrollTop + elem.clientHeight + 1 > oldHeight;
			const oldLen = elem.value.length;
			elem.setRangeText(promptText.slice(oldLen), oldLen, oldLen, 'preserve');
			const newHeight = elem.scrollHeight;
			if (atBottom && oldHeight !== newHeight) {
				elem.scrollTo({
					top: newHeight - elem.clientHeight,
					behavior: 'smooth',
				});
			}
		} else {
			elem.value = promptText;
		}
	}, [promptText]);

	useEffect(() => {
		if (cancel)
			return;
		const ac = new AbortController();
		const to = setTimeout(async () => {
			try {
				const { tokens } = await tokenize({
					endpoint,
					endpointAPI,
					content: ` ${promptText}`,
					signal: ac.signal,
				});
				setTokens(tokens.length + 1);
			} catch (e) {
				if (e.name !== 'AbortError')
					reportError(e);
			}
		}, 500);
		ac.signal.addEventListener('abort', () => clearTimeout(to));
		return () => ac.abort();
	}, [promptText, cancel]);

	useEffect(() => {
		function onKeyDown(e) {
			const { altKey, ctrlKey, shiftKey, key, defaultPrevented } = e;
			if (defaultPrevented)
				return;
			switch (`${altKey}:${ctrlKey}:${shiftKey}:${key}`) {
			case 'false:false:true:Enter':
			case 'false:true:false:Enter':
				predict();
				break;
			case 'false:false:false:Escape':
				cancel();
				break;
			default:
				return;
			}
			e.preventDefault();
		}

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [predict, cancel]);

	function onInput({ target }) {
		setPromptChunks(oldPrompt => {
			const start = [];
			const end = [];
			oldPrompt = [...oldPrompt];
			let newValue = target.value;

			while (oldPrompt.length) {
				const chunk = oldPrompt[0];
				if (!newValue.startsWith(chunk.content))
					break;
				oldPrompt.shift();
				start.push(chunk);
				newValue = newValue.slice(chunk.content.length);
			}

			while (oldPrompt.length) {
				const chunk = oldPrompt.at(-1);
				if (!newValue.endsWith(chunk.content))
					break;
				oldPrompt.pop();
				end.unshift(chunk);
				newValue = newValue.slice(0, -chunk.content.length);
			}

			return [
				...start,
				...(newValue ? [{ type: 'user', content: newValue }] : []),
				...end,
			];
		});
		undoStack.current = [];
		setUndoHovered(false);
	}

	function onScroll({ target }) {
		promptOverlay.current.scrollTop = target.scrollTop;
		promptOverlay.current.scrollLeft = target.scrollLeft;
	}

	function onPromptMouseMove({ clientX, clientY }) {
		promptOverlay.current.style.pointerEvents = 'auto';
		const elem = document.elementFromPoint(clientX, clientY);
		const pc = elem?.closest?.('[data-promptchunk]');
		const probs = elem?.closest?.('#probs');
		promptOverlay.current.style.pointerEvents = 'none';
		if (probs)
			return;
		if (!pc) {
			setCurrentPromptChunk(undefined);
			return;
		}
		const rect = [...pc.getClientRects()].at(-1);
		const index = +pc.dataset.promptchunk;
		const top = rect.top;
		const left = rect.x + rect.width / 2;
		setCurrentPromptChunk(cur => {
			if (cur && cur.index === index && cur.top === top && cur.left === left)
				return cur;
			setShowProbs(false);
			clearTimeout(probsDelayTimer.current);
			probsDelayTimer.current = setTimeout(() => setShowProbs(true), 300);
			return { index, top, left };
		});
	}

	async function switchCompletion(i, tok) {
		const newPrompt = [
			...promptChunks.slice(0, i),
			{
				...promptChunks[i],
				content: tok,
			},
		];
		setPromptChunks(newPrompt);

		if (cancel || switchCompletionDelayTimer.current) {
			cancel?.();

			// llama.cpp server sometimes generates gibberish if we stop and
			// restart right away (???)
			clearTimeout(switchCompletionDelayTimer.current);
			switchCompletionDelayTimer.current = setTimeout(async () => {
				predict(joinPrompt(newPrompt), newPrompt.length);
			}, 500);
			return;
		}

		predict(joinPrompt(newPrompt), newPrompt.length);
	}

	function switchEndpointAPI(value) {
		var url = new URL(endpoint);
		switch (value) {
			case 0: // llama.cpp
				if (url.protocol != 'http' && url.protocol != 'https')
					url.protocol = "http";
				url.port = 8080;
				break;
			case 1: // oobabooga
				if (url.protocol != 'ws' && url.protocol != 'wss')
					url.protocol = "ws";
				url.port = 5005;
				break;
			case 2: // koboldcpp
				if (url.protocol != 'http' && url.protocol != 'https')
					url.protocol = "http";
				url.port = 5001;
				break;
		}
		setEndpoint(url.toString());
		setEndpointAPI(value);
	}

	function switchDarkMode(value, force) {
		if (value) {
			document.documentElement.classList.add('dark-mode');
		} else {
			document.documentElement.classList.remove('dark-mode');
		}
		if (!force)
			setDarkMode(value);
	}

	const probs = useMemo(() =>
		showProbs && promptChunks[currentPromptChunk?.index]?.completion_probabilities?.[0]?.probs,
		[promptChunks, currentPromptChunk, showProbs]);

	return html`
		<div id="prompt-container" onMouseMove=${onPromptMouseMove}>
			<textarea
				ref=${promptArea}
				readOnly=${!!cancel}
				id="prompt-area"
				onInput=${onInput}
				onScroll=${onScroll}/>
			<div ref=${promptOverlay} id="prompt-overlay">
				${promptChunks.map((chunk, i) => {
					const isCurrent = currentPromptChunk && currentPromptChunk.index === i;
					const isNextUndo = undoHovered && !!undoStack.current.length && undoStack.current.at(-1) <= i;
					return html`
						<span
							key=${i}
							data-promptchunk=${i}
							className=${`${chunk.type === 'user' ? 'user' : 'machine'} ${isCurrent ? 'current' : ''} ${isNextUndo ? 'erase' : ''}`}>
							${(chunk.content === '\n' ? ' \n' : chunk.content) + (i === promptChunks.length - 1 && chunk.content.endsWith('\n') ? '\u00a0' : '')}
						</span>`;
				})}
			</div>
		</div>
		${probs ? html`
			<div
				id="probs"
				style=${{
					'--probs-top': `${currentPromptChunk.top}px`,
					'--probs-left': `${currentPromptChunk.left}px`,
				}}>
				${probs.map((prob, i) =>
					html`<button key=${i} onClick=${() => switchCompletion(currentPromptChunk?.index, prob.tok_str)}>
						<div className="tok">${replaceUnprintableBytes(prob.tok_str)}</div>
						<div className="prob">${(prob.prob * 100).toFixed(2)}%</div>
					</button>`)}
			</div>` : null}
		<div id="sidebar">
			<div className="sidebar-hbox">
				<${Checkbox} label="Dark Mode"
					value=${darkMode} onValueChange=${() => switchDarkMode(!darkMode, false)}/>
				<button onClick=${resetPersistence}>Reset</button>
			</div>
			<${InputBox} label="Server"
				value=${endpoint} onValueChange=${setEndpoint}/>
			<${SelectBox}
				label="API"
				value=${endpointAPI}
				onValueChange=${switchEndpointAPI}
				options=${[
					{ name: 'llama.cpp', value: 0 },
					{ name: 'oobabooga', value: 1 },
					{ name: 'koboldcpp', value: 2 },
				]}/>
			<${InputBox} label="Seed" type="text" inputmode="numeric"
				value=${seed} onValueChange=${setSeed}/>
			<${InputBox} label="Max Predict Tokens" type="text" inputmode="numeric"
				value=${maxPredictTokens} onValueChange=${setMaxPredictTokens}/>
			<${InputBox} label="Temperature" type="number" step="0.01"
				value=${temperature} onValueChange=${setTemperature}/>
			<div className="sidebar-hbox">
				<${InputBox} label="Repeat penalty" type="number" step="0.01"
					value=${repeatPenalty} onValueChange=${setRepeatPenalty}/>
				<${InputBox} label="Repeat last n" type="number" step="1"
					value=${repeatLastN} onValueChange=${setRepeatLastN}/>
			</div>
			${endpointAPI == 0 && html`
				<${Checkbox} label="Penalize NL"
					value=${penalizeNl} onValueChange=${setPenalizeNl}/>`}
			<div className="sidebar-hbox">
				<${InputBox} label="Presence penalty" type="number" step="0.01"
					value=${presencePenalty} onValueChange=${setPresencePenalty}/>
				<${InputBox} label="Frequency penalty" type="number" step="1"
					value=${frequencyPenalty} onValueChange=${setFrequencyPenalty}/>
			</div>
			${temperature <= 0 ? null : html`
				<${SelectBox}
					label="Mirostat"
					value=${mirostat}
					onValueChange=${setMirostat}
					options=${[
						{ name: 'Off', value: 0 },
						{ name: 'Mirostat', value: 1 },
						{ name: 'Mirostat 2.0', value: 2 },
					]}/>
				${mirostat ? html`
					<div className="sidebar-hbox">
						<${InputBox} label="Mirostat τ" type="number" step="0.01"
							value=${mirostatTau} onValueChange=${setMirostatTau}/>
						<${InputBox} label="Mirostat η" type="number" step="0.01"
							value=${mirostatEta} onValueChange=${setMirostatEta}/>
					</div>
				` : html`
					<div className="sidebar-hbox">
						<${InputBox} label="Top K" type="number" step="1"
							value=${topK} onValueChange=${setTopK}/>
						<${InputBox} label="Top P" type="number" step="1"
							value=${topP} onValueChange=${setTopP}/>
					</div>
					<div className="sidebar-hbox">
						<${InputBox} label="Typical p" type="number" step="0.01"
							value=${typicalP} onValueChange=${setTypicalP}/>
						<${InputBox} label="Tail Free Sampling z" type="number" step="0.01"
							value=${tfsZ} onValueChange=${setTfsZ}/>
					</div>
				`}
			`}
			${endpointAPI != 2 && html`
				<${Checkbox} label="Ignore <eos>"
					value=${ignoreEos} onValueChange=${setIgnoreEos}/>`}
			${!!tokens && html`
				<${InputBox} label="Tokens" value=${tokens} readOnly/>`}
			<div className="buttons">
				<button
					className=${cancel ? 'completing' : ''}
					disabled=${!!cancel}
					onClick=${() => predict()}>
					Predict
				</button>
				${!cancel && !!undoStack.current.length && html`
					<button
						onClick=${() => undo()}
						onMouseEnter=${() => setUndoHovered(true)}
						onMouseLeave=${() => setUndoHovered(false)}>
						Undo
					</button>`}
				<button disabled=${!cancel} onClick=${cancel}>Cancel</button>
			</div>
		</div>`;
}