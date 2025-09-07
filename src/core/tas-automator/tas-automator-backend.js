

export class TASAutomatorScript {
  constructor(id) {
    this._id = id;
    this._compiled = this.text.split('\n');
  }

  get id() {
    return this._id;
  }

  get name() {
    return this.persistent.name;
  }

  set name(value) {
    this.persistent.name = value;
  }

  get persistent() {
    return player.speedrun.TASAutomator.scripts[this._id];
  }

  get commands() {
    return this._compiled;
  }

  get text() {
    return this.persistent.content;
  }

  save(content) {
    if (TASAutomatorData.isWithinLimit()) this.persistent.content = content;
    this._compiled = this.text.split('\n');
  }

  static create(name, content = "") {
    const scripts = Object.keys(player.speedrun.TASAutomator.scripts);
    const missingIndex = scripts.findIndex((x, y) => y + 1 !== Number(x));
    let id = 1 + (missingIndex === -1 ? scripts.length : missingIndex);
    // On a fresh save, this executes before player is properly initialized
    if (!player.speedrun.TASAutomator.scripts || id === 0) id = 1;
    player.speedrun.TASAutomator.scripts[id] = {
      id,
      name,
      content,
    };
    return new TASAutomatorScript(id);
  }

  compile() {
    TASAutomatorData.cachedErrors = 0;
    TASAutomatorData.errorLog = [];
    let blockCount = 0;
    this.commands.forEach((command, _) => {
      if (command.replace(/^[ \t]+/, "") == "" || TASAutomatorCommands[0].key.test(command)) return false;
      
      TASAutomatorCommands.some((com, __) => {
        if (com.key.test(command.replace(/^[ \t]+/, ''))) {
          if(!com.checkRule(command)) return false;
          let isBlock = com.string[0] === "if";
          const IFBlockType = com.string[0] === "if" ? "if" : "";
          const IFELSEBlockType = (com.string[1] == "else" && com.string[2] == "if") ? "else ifF" : "";
          const ELSEBlockType = com.string[1] === "else" ? "else" : "";
          const WhileBlockType = com.string[0] === "while" ? "while" : "";
          const UntilBlockType = com.string[0] === "until" ? "until" : "";

          if (IFBlockType || WhileBlockType || UntilBlockType) {
            blockCount++;
          }

          TASAutomatorBackend.stack.push({
            run: () => com.run(command, _+1),
            line: _+1,
            codeBlock: isBlock,
            endBlock: command.includes("}"),
            blockDepth: blockCount,
            BlockType: IFBlockType || IFELSEBlockType || ELSEBlockType || WhileBlockType || UntilBlockType,
            command
          });

          if (command.includes("}") && !(IFELSEBlockType || ELSEBlockType)) {
            blockCount--;
          }

          return true;
        }
        else if (__ == TASAutomatorCommands.length-1)  {
          TASAutomatorData.addError({line: _+1, command: command, info: "Not a Valid Command"});
        }
      })
    });

    if (blockCount != 0) TASAutomatorData.addError({line: 0, command: "", info: "Uneven code Blocks"});

  }
}

export const TASAutomatorData = {
  // Used for getting the correct EC count in event log
  lastECCompletionCount: 0,
  // Used as a flag to make sure that wait commands only add one entry to the log instead of every execution attempt
  isWaiting: false,
  waitStart: 0,
  lastEvent: 0,
  eventLog: [],
  isEditorFullscreen: false,
  needsRecompile: true,
  cachedErrors: 0,
  errorLog: [],

  undoBuffer: [],
  redoBuffer: [],
  charsSinceLastUndoState: 0,

  MAX_ALLOWED_SCRIPT_CHARACTERS: 15000,
  MAX_ALLOWED_TOTAL_CHARACTERS: 150000,
  MAX_ALLOWED_SCRIPT_NAME_LENGTH: 50,
  MAX_ALLOWED_SCRIPT_COUNT: 50,

  MIN_CHARS_BETWEEN_UNDOS: 10,
  MAX_UNDO_ENTRIES: 20,

  scriptIndex() {
    return player.speedrun.TASAutomator.state.editorScript;
  },
  currentScriptName() {
    return player.speedrun.TASAutomator.scripts[this.scriptIndex()].name;
  },
  currentScriptText(index) {
    const toCheck = index || this.scriptIndex();
    return player.speedrun.TASAutomator.scripts[toCheck]?.content;
  },
  createNewScript(content, name) {
    const newScript = TASAutomatorScript.create(name, content);
    GameUI.notify.automator(`Imported Script "${name}"`);
    player.speedrun.TASAutomator.state.editorScript = newScript.id;
    TASAutomatorData.clearUndoData();
    EventHub.dispatch(GAME_EVENT.AUTOMATOR_SAVE_CHANGED);
  },
  addError(Error){
    this.errorLog.push(Error);
    this.cachedErrors++;
  },
  logCommandEvent(message, line) {
    const currTime = Date.now();
    this.eventLog.push({
      // Messages often overflow the 120 col limit and extra spacing gets included in the message - remove it
      message: message.replaceAll(/\s?\n\s+/gu, " "),
      line: TASAutomatorBackend.translateLineNumber(line),
      thisReality: Time.realTimePlayed.totalSeconds,
      timestamp: currTime,
      timegap: currTime - this.lastEvent
    });
    this.lastEvent = currTime;
    // Remove the oldest entry if the log is too large
    if (this.eventLog.length > player.options.automatorEvents.maxEntries) this.eventLog.shift();
  },
  clearEventLog() {
    this.eventLog = [];
    this.lastEvent = 0;
  },
   // We need to get the current character count from the editor itself instead of the player object, because otherwise
  // any changes made after getting above either limit will never be saved. Note that if the player is on the automator
  // subtab before the automator is unlocked, editor is undefined
  singleScriptCharacters() {
    return TASAutomatorTextUI.editor?.getDoc().getValue().length ?? 0;
  },
  totalScriptCharacters() {
    return Object.values(player.speedrun.TASAutomator.scripts)
      .filter(s => s.id !== this.scriptIndex())
      .map(s => s.content.length)
      .reduce((sum, len) => sum + len, 0) +
      this.singleScriptCharacters();
  },
  isWithinLimit() {
    return this.singleScriptCharacters() <= this.MAX_ALLOWED_SCRIPT_CHARACTERS &&
      this.totalScriptCharacters() <= this.MAX_ALLOWED_TOTAL_CHARACTERS;
  },

  // This must be called every time the current script or editor mode are changed
  clearUndoData() {
    this.undoBuffer = [];
    this.redoBuffer = [];
    this.charsSinceLastUndoState = 0;
  },
  // We only save an undo state every so often based on the number of characters that have been modified
  // since the last state. This gets passed in as a parameter and gets called every time any typing is done,
  // but only actually does something when that threshold is reached.
  pushUndoData(data, newChars) {
    // If the buffer is empty, then we need to immediately write to the buffer (ignoring character changes)
    // because otherwise edits can't be fully undone back to the very first change
    this.charsSinceLastUndoState += newChars;
    const pastGap = this.charsSinceLastUndoState <= this.MIN_CHARS_BETWEEN_UNDOS;
    if (pastGap && this.undoBuffer.length !== 0) return;

    if (this.undoBuffer[this.undoBuffer.length - 1] !== data) this.undoBuffer.push(data);
    if (this.undoBuffer.length > this.MAX_UNDO_ENTRIES) this.undoBuffer.shift();
    this.charsSinceLastUndoState = 0;
  },
  pushRedoData(data) {
    if (this.redoBuffer[this.redoBuffer.length - 1] !== data) this.redoBuffer.push(data);
  },
  // These following two methods pop the top entry off of the undo/redo stack and then push it
  // onto the *other* stack before modifying all the relevant UI elements and player props. These
  // could in principle be combined into one function to reduce boilerplace, but keeping them
  // separate is probably more readable externally
  undoScriptEdit() {
    if (this.undoBuffer.length === 0 || Tabs.current._currentSubtab.name !== "TAS") return;

    const undoContent = this.undoBuffer.pop();
    this.pushRedoData(this.currentScriptText());
    player.speedrun.TASAutomator.scripts[this.scriptIndex()].content = undoContent;

    TASAutomatorBackend.saveScript(this.scriptIndex(), undoContent);
    TASAutomatorTextUI.editor.setValue(undoContent);
  },
  redoScriptEdit() {
    if (this.redoBuffer.length === 0 || Tabs.current._currentSubtab.name !== "TAS") return;

    const redoContent = this.redoBuffer.pop();
    // We call this with a value which is always higher than said threshold, forcing the current text to be pushed
    this.pushUndoData(this.currentScriptText(), 2 * this.MIN_CHARS_BETWEEN_UNDOS);
    player.speedrun.TASAutomator.scripts[this.scriptIndex()].content = redoContent;

    TASAutomatorBackend.saveScript(this.scriptIndex(), redoContent);
    TASAutomatorTextUI.editor.setValue(redoContent);
  }
};

// Manages line highlighting in a way which is agnostic to the current editor mode (line or block). Ironically this is
// actually easier to manage in block mode as the Vue components render each line individually and we can just
// conditionally add classes in the template. The highlighting in text mode needs to be spliced and removed inline
// within the CodeMirror editor
export const TASAutomatorHighlighter = {
  lines: {
    active: -1,
    event: -1,
    error: -1,
  },

  updateHighlightedLine(line, key) {
    if (line !== -1) {
      if (!TASAutomatorTextUI.editor) return;
      this.removeHighlightedTextLine(key);
      this.addHighlightedTextLine(line, key);
    } else {
      this.lines[key] = line;
    }
  },

  // We need to specifically remove the highlighting class from the old line before splicing it in for the new line
  removeHighlightedTextLine(key) {
    const removedLine = this.lines[key] - 1;
    TASAutomatorTextUI.editor.removeLineClass(removedLine, "background", `c-automator-editor__${key}-line`);
    TASAutomatorTextUI.editor.removeLineClass(removedLine, "gutter", `c-automator-editor__${key}-line-gutter`);
    this.lines[key] = -1;
  },

  addHighlightedTextLine(line, key) {
    TASAutomatorTextUI.editor.addLineClass(line - 1, "background", `c-automator-editor__${key}-line`);
    TASAutomatorTextUI.editor.addLineClass(line - 1, "gutter", `c-automator-editor__${key}-line-gutter`);
    this.lines[key] = line;
  },

  clearAllHighlightedLines() {
    for (const lineType of Object.values(LineEnum)) {
      if (TASAutomatorTextUI.editor) {
        for (let line = 0; line < TASAutomatorTextUI.editor.doc.size; line++) {
          TASAutomatorTextUI.editor.removeLineClass(line, "background", `c-automator-editor__${lineType}-line`);
          TASAutomatorTextUI.editor.removeLineClass(line, "gutter", `c-automator-editor__${lineType}-line-gutter`);
        }
      }
      this.lines[lineType] = -1;
    }
  }
};

// Manages line highlighting in a way which is agnostic to the current editor mode (line or block)
export const TASAutomatorScroller = {

  scrollToLine(line) {
    let editor, textHeight, lineToScroll;
    // We can't use CodeMirror's scrollIntoView() method as that forces the entire viewport to keep the line in view.
    // This can potentially cause a softlock with "follow execution" enabled on sufficiently short screens.
    editor = document.querySelector(".CodeMirror-scroll");
    textHeight = TASAutomatorTextUI.editor.defaultTextHeight();
    lineToScroll = line + 1;

    // In both cases we might potentially try to scroll before the editor has properly initialized (ie. the automator
    // itself ends up loading up faster than the editor UI element)
    if (!editor) return;

    const paddedHeight = editor.clientHeight - 40;
    const newScrollPos = textHeight * (lineToScroll - 1);
    if (newScrollPos > editor.scrollTop + paddedHeight) editor.scrollTo(0, newScrollPos - paddedHeight);
    if (newScrollPos < editor.scrollTop) editor.scrollTo(0, newScrollPos);
  }
};

export const TASAutomatorBackend = {
  MAX_COMMANDS_PER_UPDATE: 2500,
  hasJustCompleted: false,
  timeOut: 0,
  _scripts: [],
  
  get comandsPerUpdate() {return Math.clamp(player.speedrun.mods.TASCommandsPerTick, 0, 1000)},

  get state() {
    return player.speedrun.TASAutomator.state;
  },

  // The Automator may be paused at some instruction, but still be on.
  get isOn() {
    return !this.stack.isEmpty && TASAutomatorData.cachedErrors == 0;
  },

  /**
  * @returns {AUTOMATOR_MODE}
  */
  get mode() {
    return this.state.mode;
  },

  set mode(value) {
    this.state.mode = value;
  },

  get isRunning() {
    return this.isOn && this.mode === AUTOMATOR_MODE.RUN;
  },

  findRawScriptObject(id) {
    const scripts = player.speedrun.TASAutomator.scripts;
    const index = Object.values(scripts).findIndex(s => s.id === id);
    return scripts[parseInt(Object.keys(scripts)[index], 10)];
  },

  get currentRunningScript() {
    return this.findRawScriptObject(this.state.topLevelScript);
  },

  get currentEditingScript() {
    return this.findRawScriptObject(player.speedrun.TASAutomator.state.editorScript);
  },

  get scriptName() {
    return this.currentRunningScript?.name ?? "";
  },

  hasDuplicateName(name) {
    const nameArray = Object.values(player.speedrun.TASAutomator.scripts).map(s => s.name);
    return nameArray.filter(n => n === name).length > 1;
  },

  // Scripts are internally stored and run as text, but block mode has a different layout for loops that
  // shifts a lot of commands around. Therefore we need to conditionally change it based on mode in order
  // to make sure the player is presented with the correct line number
  translateLineNumber(num) {
    return num;
  },

  get currentLineNumber() {
    if (!this.stack.top) return -1;
    return this.stack.top.line;
  },

  get currentInterval() {
    return 1;
  },

  get currentRawText() {
    return this.currentRunningScript?.content ?? "";
  },

  get currentScriptLength() {
    return this.currentRawText.split("\n").length;
  },

  // Finds which study presets are referenced within the specified script
  getUsedPresets(scriptID) {
    const script = this.findRawScriptObject(scriptID);
    if (!script) return null;

    const foundPresets = new Set();
    const lines = script.content.split("\n");
    for (const rawLine of lines) {
      const matchPresetID = rawLine.match(/studies( nowait)? load id ([1-6])/ui);
      if (matchPresetID) foundPresets.add(Number(matchPresetID[2]) - 1);
      const matchPresetName = rawLine.match(/studies( nowait)? load name (\S+)/ui);
      if (matchPresetName) {
        // A script might pass the regex match, but actually be referencing a preset which doesn't exist by name
        const presetID = player.timestudy.presets.findIndex(p => p.name === matchPresetName[2]);
        if (presetID !== -1) foundPresets.add(presetID);
      }
    }
    const presets = Array.from(foundPresets);
    presets.sort();
    return presets;
  },

  // We can't just concatenate different parts of script data together or use some kind of delimiting character string
  // due to the fact that comments can essentially contain character sequences with nearly arbitrary content and
  // length. Instead, we take the approach of concatenating all data together with their lengths prepended at the start
  // of each respective data string. For example:
  //    ["blob", "11,21,31"] => "00004blob0000811,21,31"
  // Note that the whole string can be unambiguously parsed from left-to-right regardless of the actual data contents.
  // All numerical values are assumed to be exactly 5 characters long for consistency and since the script length limit
  // is 5 digits long.
  serializeTASAutomatorData(dataArray) {
    const paddedNumber = num => `0000${num}`.slice(-5);
    const segments = [];
    for (const data of dataArray) {
      segments.push(`${paddedNumber(data.length)}${data}`);
    }
    return segments.join("");
  },

  // Inverse of the operation performed by serializeTASAutomatorData(). Can throw an error for malformed inputs, but this
  // will always be caught farther up the call chain and interpreted properly as an invalid dataString.
  deserializeTASAutomatorData(dataString) {
    if (dataString === "") throw new Error("Attempted deserialization of empty string");
    const dataArray = [];
    let remainingData = dataString;
    while (remainingData.length > 0) {
      const segmentLength = Number(remainingData.slice(0, 5));
      remainingData = remainingData.substr(5);
      if (Number.isNaN(segmentLength) || remainingData.length < segmentLength) {
        throw new Error("Inconsistent or malformed serialized automator data");
      } else {
        const segmentData = remainingData.slice(0, segmentLength);
        remainingData = remainingData.substr(segmentLength);
        dataArray.push(segmentData);
      }
    }
    return dataArray;
  },

  // This exports only the text contents of the currently-visible script
  exportCurrentScriptContents() {
    // Cut off leading and trailing whitespace
    const trimmed = TASAutomatorData.currentScriptText().replace(/^\s*(.*?)\s*$/u, "$1");
    if (trimmed.length === 0) return null;
    // Serialize the script name and content
    const name = TASAutomatorData.currentScriptName();
    return GameSaveSerializer.encodeText(this.serializeTASAutomatorData([name, trimmed]), "TASAutomator script");
  },

  // This parses script content from an encoded export string; does not actually import anything
  parseScriptContents(rawInput) {
    let decoded, parts;
    try {
      decoded = GameSaveSerializer.decodeText(rawInput, "TASAutomator script");
      parts = this.deserializeTASAutomatorData(decoded);
    } catch (e) {
      return null;
    }

    return {
      name: parts[0],
      content: parts[1],
    };
  },

  // Creates a new script from the supplied import string
  importScriptContents(rawInput) {
    const parsed = this.parseScriptContents(rawInput);
    TASAutomatorData.createNewScript(parsed.content, parsed.name);
    this.initializeFromSave();
  },

  update() {
    if (!this.isOn) return;
    if (TASAutomatorData.cachedErrors > 0) return this.stop();

    if (this.timeOut > 0) {
      this.timeOut -= DeltaTimeState.unscaledDeltaTime.totalMilliseconds;
      return;
    }

    switch (this.mode) {
      case AUTOMATOR_MODE.PAUSE:
        return;
      case AUTOMATOR_MODE.SINGLE_STEP:
        this.step();
        this.state.mode = AUTOMATOR_MODE.PAUSE;
        this.latestPrestige = -1;
        return;
      case AUTOMATOR_MODE.RUN:
        for (let C=0; C < this.comandsPerUpdate && this.isRunning; C++) {
          this.step();
          if (this.timeOut > 0) break;
        }
        this.latestPrestige = -1;
        break;
      default:
        this.stop();
        return;
    }
  },

  latestPrestige: -1,
  BlockEntered: [],
  get TopBlockEntered() {
    if (this.BlockEntered[this.stack.top.blockDepth] == undefined) this.BlockEntered[this.stack.top.blockDepth] = {Entered: false, Type: "", Start: 0};
    return this.BlockEntered[this.stack.top.blockDepth].Entered;
  },

  set TopBlockEntered(v) {
    if (this.BlockEntered[this.stack.top.blockDepth] == undefined) {
      this.BlockEntered[this.stack.top.blockDepth] = {Entered: v, Type: "", Start: 0};
      return;
    }
    this.BlockEntered[this.stack.top.blockDepth].Entered = v;
  },

  get TopBlock() {
    if (this.BlockEntered[this.stack.top.blockDepth] == undefined) this.BlockEntered[this.stack.top.blockDepth] = {Entered: false, Type: "", Start: 0};
    return this.BlockEntered[this.stack.top.blockDepth];
  },

  step() {
    if (this.stack.isEmpty || TASAutomatorData.cachedErrors > 0) return;
    if(this.stack.top == undefined) {
      if(this.stack.top == undefined) this.hasJustCompleted = true;
      if(player.speedrun.TASAutomator.state.repeat) this.restart();
      else {
        this.stop();
        return false;
      }
    }
    let keepGoing = true;
    for (let steps = 0; steps < 50 && keepGoing; steps++) {
      switch (this.runCurrentCommand()) {
        case AUTOMATOR_COMMAND_STATUS.SAME_INSTRUCTION:
          return true;
        case AUTOMATOR_COMMAND_STATUS.NEXT_INSTRUCTION:
          return this.nextCommand();
        case AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION:
          return false;
        case AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION:
          this.nextCommand();
          return false;
        case AUTOMATOR_COMMAND_STATUS.SKIP_INSTRUCTION:
          this.nextCommand();
          break;
        case AUTOMATOR_COMMAND_STATUS.HALT:
          this.stop();
          return false;
        case AUTOMATOR_COMMAND_STATUS.TIME_OUT:
          this.nextCommand();
          return true;
        case AUTOMATOR_COMMAND_STATUS.ENTER_BLOCK:
          this.enterBlock();
          return true;
        case AUTOMATOR_COMMAND_STATUS.EXIT_BLOCK:
          this.exitBlock();
          break;
        case AUTOMATOR_COMMAND_STATUS.SKIP_BLOCK:
          this.skipBlock();
          return false;
        case AUTOMATOR_COMMAND_STATUS.RESTART:
          this.restart();
          return false;
      }
      if(this.stack.top == undefined) this.hasJustCompleted = true;
    }
    
    // I dont think this can ever happen

    if (!this.hasJustCompleted) {
      GameUI.notify.error("TAS Automator ended - too many consecutive no-ops detected");
      TASAutomatorData.logCommandEvent("TAS Automator ended due to excessive no-op commands", this.currentLineNumber);
    }

    this.stop();
    return false;
  },

  runCurrentCommand() {
    const S = this.stack.top;
    const cmdState = S.run(S);
    return cmdState;
  },

  enterBlock() {
    this.TopBlockEntered = true;
    this.TopBlock.Start = this.stack.top.line;
    this.TopBlock.Type = this.stack.top.BlockType;
    this.stack.blockDepth++;
    this.nextCommand();
    return true;
  },

  exitBlock() {
    if (this.TopBlock.Type == "while" || this.TopBlock.Type == "until") {
      const V = this.stack._data[this.TopBlock.Start -1].run();
      
      if (V == AUTOMATOR_COMMAND_STATUS.SKIP_BLOCK) {
        this.stack.blockDepth--;
        this.TopBlockEntered = false;
        this.nextCommand();
        return false;
      }
      this.stack.line = this.TopBlock.Start;
      return true;
    }

    this.stack.blockDepth--;
    this.TopBlockEntered = false;
    this.nextCommand();
    return true;
  },

  skipBlock() {
    let StartBlock = this.stack.top.blockDepth;
    while (this.stack.top != undefined) {
      this.stack.line++;
      if (this.stack.top == undefined) break; // this shouldn't happen but just too be safe
      if (this.stack.top.endBlock && this.stack.top.blockDepth == StartBlock) {
        break;
      }
    }

    return true;
  },
  
  nextCommand() {
    this.stack.line++
    if (this.stack.top == undefined) {
      if (player.speedrun.TASAutomator.state.repeat) this.restart();
      this.stack.line = 0;
    };
    return true;
  },

  push(commands) {
    // We do not allow empty scripts on the stack.
    if (commands.length === 0) return;
    this.stack.push(commands);
  },

  findScript(id) {
    return this._scripts.find(e => e.id === id);
  },

  _createDefaultScript() {
    const defaultScript = TASAutomatorScript.create("New Script");
    this._scripts = [defaultScript];
    this.state.topLevelScript = defaultScript.id;
    this.stack.clear();
    return defaultScript.id;
  },

  initializeFromSave() {
    const scriptIds = Object.keys(player.speedrun.TASAutomator.scripts).map(id => parseInt(id, 10));
    if (scriptIds.length === 0) {
      scriptIds.push(this._createDefaultScript());
    } else {
      this._scripts = scriptIds.map(s => new TASAutomatorScript(s));
    }
    if (!scriptIds.includes(this.state.topLevelScript)) this.state.topLevelScript = scriptIds[0];
    const currentScript = this.findScript(this.state.topLevelScript);
    if (currentScript.commands) {
      const commands = currentScript.commands;
      if (!this.stack.initializeFromSave(commands)) this.reset(commands);
    } else {
      this.stack.clear();
    }
  },

  // Note: This gets run every time any edit or mode conversion is done
  saveScript(id, data) {
    const script = this.findScript(id);
    if (!script) return;

    // Add the old data to the undo buffer; there are internal checks which prevent it from saving too often.
    // For performance, the contents of the script aren't actually checked (this would be an unavoidable O(n) cost).
    // Instead we naively assume length changes are pure insertions and deletions, which does mean we're ignoring
    // a few edge cases when changes are really substitutions that massively change the content
    const oldData = script.persistent.content;
    const lenChange = Math.abs(oldData.length - data.length);
    TASAutomatorData.pushUndoData(oldData, lenChange);

    script.save(data);
    if (id === this.state.topLevelScript) this.stop();
  },

  newScript() {
    // Make sure the new script has a unique name
    const scriptNames = TASAutomatorBackend._scripts.map(s => s.name);
    let newScript;
    if (scriptNames.includes("New Script")) {
      let newIndex = 2;
      while (scriptNames.includes(`New Script (${newIndex})`)) newIndex++;
      newScript = TASAutomatorScript.create(`New Script (${newIndex})`);
    } else {
      newScript = TASAutomatorScript.create("New Script");
    }

    this._scripts.push(newScript);
    return newScript;
  },

  // Note that deleting scripts leaves gaps in the automator script indexing since automator scripts can't be
  // dynamically re-indexed while the automator is running without causing a stutter from recompiling scripts.
  deleteScript(id) {
    // We need to delete scripts from two places - in the savefile and compiled TASAutomatorScript Objects
    const saveId = Object.values(player.speedrun.TASAutomator.scripts).findIndex(s => s.id === id);
    delete player.speedrun.TASAutomator.scripts[parseInt(Object.keys(player.speedrun.TASAutomator.scripts)[saveId], 10)];
    const idx = this._scripts.findIndex(e => e.id === id);
    this._scripts.splice(idx, 1);
    if (this._scripts.length === 0) {
      this._createDefaultScript();
      this.clearEditor();
    }
    if (id === this.state.topLevelScript) {
      this.stop();
      this.state.topLevelScript = this._scripts[0].id;
    }
    EventHub.dispatch(GAME_EVENT.AUTOMATOR_SAVE_CHANGED);
  },

  toggleRepeat() {
    this.state.repeat = !this.state.repeat;
  },

  toggleForceRestart() {
    this.state.forceRestart = !this.state.forceRestart;
  },

  toggleFollowExecution() {
    this.state.followExecution = !this.state.followExecution;
    this.jumpToActiveLine();
  },

  jumpToActiveLine() {
    const state = this.state;
    const focusedScript = state.topLevelScript === state.editorScript;
    if (focusedScript && this.isRunning && state.followExecution) {
      TASAutomatorScroller.scrollToLine(TASAutomatorBackend.stack.top.lineNumber);
    }
  },

  stop() {
    this.stack.clear();
    this.state.mode = AUTOMATOR_MODE.PAUSE;
    this.latestPrestige = -1;
    this.hasJustCompleted = true;
    TASAutomatorHighlighter.clearAllHighlightedLines();
  },

  pause() {
    this.state.mode = AUTOMATOR_MODE.PAUSE;
  },

  start(scriptID = this.state.topLevelScript, initialMode = AUTOMATOR_MODE.RUN, compile = true) {
    this.hasJustCompleted = false;
    this.state.topLevelScript = scriptID;
    player.speedrun.TASAutomator.execTimer = 0;
    const scriptObject = this.findScript(scriptID);
    if (!scriptObject) return;
    if (compile) scriptObject.compile();
    if (TASAutomatorData.cachedErrors > 0) return this.stop();
    if (scriptObject.commands) {
      this.state.mode = initialMode;
    }
    TASAutomatorData.isWaiting = false;
    if (player.options.automatorEvents.clearOnRestart) TASAutomatorData.clearEventLog();
  },

  compile(){
    this.findScript(this.state.topLevelScript).compile();
  },

  restart() {
    this.stack.line = 0;
    this.blockDepth = 0;
    this.latestPrestige = -1;
    TASAutomatorBackend.BlockEntered = [];
  },

  stack: {
    _data: [],
    line: 0,
    blockDepth: 0,
    get commandLine() {
      return this._data[this.line]?.line || 0;
    },
    push(command) {
      player.speedrun.TASAutomator.state.stack.push(command);
      this._data.push(command);
    },
    pop() {
      if (this._data.length === 0) return;
      player.speedrun.TASAutomator.state.stack.pop();
      this._data.pop();
    },
    clear() {
      this._data = [];
      player.speedrun.TASAutomator.state.stack = [];
      this.line = 0;
      this.blockDepth = 0;
      TASAutomatorData.errorLog = [];
      TASAutomatorData.cachedErrors = 0;
      TASAutomatorBackend.BlockEntered = [];
    },
    initializeFromSave(commands) { // maybe later
      this._data = [];
      return true;
    },
    get top() {
      return this._data[this.line];
    },
    get length() {
      if (this._data.length !== player.speedrun.TASAutomator.state.stack.length) {
        throw new Error("Inconsistent stack length");
      }
      return this._data.length;
    },
    get isEmpty() {
      return this._data.length === 0;
    }
  },
};

EventHub.logic.on(GAME_EVENT.DIMBOOST_AFTER, () => TASAutomatorBackend.latestPrestige = PRESTIGE_EVENT.DIMENSION_BOOST);
EventHub.logic.on(GAME_EVENT.GALAXY_RESET_AFTER, () => TASAutomatorBackend.latestPrestige = PRESTIGE_EVENT.ANTIMATTER_GALAXY);
EventHub.logic.on(GAME_EVENT.BIG_CRUNCH_AFTER, () => TASAutomatorBackend.latestPrestige = PRESTIGE_EVENT.INFINITY);
EventHub.logic.on(GAME_EVENT.ETERNITY_RESET_AFTER, () => TASAutomatorBackend.latestPrestige = PRESTIGE_EVENT.ETERNITY);
EventHub.logic.on(GAME_EVENT.REALITY_RESET_AFTER, () => TASAutomatorBackend.latestPrestige = PRESTIGE_EVENT.REALITY);