<script>
export default {
  name: "TASAutomatorTextEditor",
  props: {
    currentScriptId: {
      type: [Number, String],
      required: true
    },
  },
  data() {
    return {
      markedLineNumber: 0,
      unclearedLines: false,
      isActiveScript: false,
    };
  },
  computed: {
    UI() {
      TASAutomatorTextUI.initialize();
      return TASAutomatorTextUI;
    },
    fullScreen() {
      return this.$viewModel.tabs.TASAutomator.fullScreen;
    },
  },
  watch: {
    currentScriptId: {
      handler(id, oldId) {
        this.unmarkActiveLine();
        const storedScripts = player.speedrun.TASAutomator.scripts;
        if (!this.UI.documents[id] || this.UI.documents[id].getValue() !== storedScripts[id].content) {
          this.UI.documents[id] = CodeMirror.Doc(storedScripts[id].content, "TAS");
        }
        if (this.UI.editor.getDoc() !== this.UI.documents[id]) this.UI.editor.swapDoc(this.UI.documents[id]);
        // When a script gets deleted, get rid of the old document object
        if (this.UI.documents[oldId] !== undefined && storedScripts[oldId] === undefined) {
          delete this.UI.documents[oldId];
        }
      },
      immediate: true,
    },
    fullScreen() {
      this.$nextTick(() => this.UI.editor.refresh());
    }
  },
  created() {
    TASAutomatorTextUI.initialize();
    this.on$(GAME_EVENT.GAME_LOAD, () => this.onGameLoad());
    this.on$(GAME_EVENT.AUTOMATOR_SAVE_CHANGED, () => this.onGameLoad());
  },
  mounted() {
    this.$refs.container.appendChild(this.UI.container);
    this.$nextTick(() => {
      this.UI.editor.refresh();
      this.UI.editor.performLint();
      this.UI.editor.scrollTo(null, TASAutomatorTextUI.savedVertPos);
    });
  },
  beforeDestroy() {
    // This will stick around, otherwise
    TASAutomatorHighlighter.clearAllHighlightedLines();
    TASAutomatorTextUI.savedVertPos = TASAutomatorTextUI.editor.doc.scrollTop;
    this.$refs.container.removeChild(this.UI.container);
  },
  methods: {
    update() {
      TASAutomatorBackend.jumpToActiveLine();
      if (this.unclearedLines && !TASAutomatorBackend.isOn) this.clearAllActiveLines();
      if (TASAutomatorBackend.isOn) {
        this.setActiveState(`${TASAutomatorBackend.state.topLevelScript}`, TASAutomatorBackend.stack.commandLine);
      } else {
        this.setActiveState("", -1);
      }
    },
    onGameLoad() {
      this.UI.documents = {};
    },
    unmarkActiveLine() {
      TASAutomatorHighlighter.updateHighlightedLine(-1, LineEnum.Active);
    },
    markActiveLine(lineNumber) {
      TASAutomatorHighlighter.updateHighlightedLine(lineNumber, LineEnum.Active);
      this.unclearedLines = true;
    },
    // This only runs when a script is interrupted and stops during execution because of the player editing the text
    clearAllActiveLines() {
      TASAutomatorHighlighter.clearAllHighlightedLines();
      this.unclearedLines = false;
    },
    setActiveState(scriptID, lineNumber) {
      if (`${this.currentScriptId}` === scriptID) this.markActiveLine(lineNumber);
      else this.unmarkActiveLine();
    },
  }
};

export const TASAutomatorTextUI = {
  documents: {},
  wrapper: null,
  editor: null,
  container: null,
  textArea: null,
  mode: {
    mode: "TAS",
    lint: "TAS",
    lineNumbers: true,
    theme: "liquibyte",
    tabSize: 2,
    extraKeys: {
      Tab: cm => cm.execCommand("indentMore"),
      "Shift-Tab": cm => cm.execCommand("indentLess"),
    },
    autoCloseBrackets: true,
    lineWrapping: true,
  },
  initialize() {
    if (this.container) return;
    this.setUpContainer();
    this.setUpEditor();
    EventHub.ui.on(GAME_EVENT.GAME_LOAD, () => this.documents = {});
  },
  setUpContainer() {
    this.container = document.createElement("div");
    this.container.className = "l-automator-editor__codemirror-container";
    this.textArea = document.createElement("textarea");
    this.container.appendChild(this.textArea);
  },
  setUpEditor() {
    this.editor = CodeMirror.fromTextArea(this.textArea, this.mode);
    // CodeMirror has a built-in undo/redo functionality bound to ctrl-z/ctrl-y which doesn't have an
    // easily-configured history buffer; we need to specifically cancel this event since we have our own undo
    this.editor.on("beforeChange", (_, event) => {
      if (event.origin === "undo") event.cancel();
    });
    this.editor.on("keydown", (editor, event) => {
      const key = event.key;
      if (event.ctrlKey && ["z", "y"].includes(key)) {
        if (key === "z") TASAutomatorData.undoScriptEdit();
        if (key === "y") TASAutomatorData.redoScriptEdit();
        return;
      }
      // This check is related to the drop-down command suggestion menu, but must come after the undo/redo check
      // as it often evaluates to innocuous false positives which eat the keybinds
      if (editor.state.completionActive) return;
      if (event.ctrlKey || event.altKey || event.metaKey || !/^[a-zA-Z0-9 \t]$/u.test(key)) return;
      CodeMirror.commands.autocomplete(editor, null, { completeSingle: false });
    });
    this.editor.on("change", (editor, event) => {
      const scriptID = ui.view.tabs.TASAutomator.editorScriptID;
      const scriptText = editor.getDoc().getValue();
      // Undo/redo directly changes the editor contents, which also causes this event to be fired; we have a few
      // things which we specifically only want to do on manual typing changes
      if (event.origin !== "setValue") {
        TASAutomatorBackend.saveScript(scriptID, scriptText);
        TASAutomatorData.redoBuffer = [];
      }
      // Clear all line highlighting as soon as any text is changed because that might have shifted lines around
      TASAutomatorHighlighter.clearAllHighlightedLines();
    });
  },
  clearEditor() {
    // In some importing cases (mostly when importing a save without the automator unlocked), the editor doesn't exist
    // and attempting to modify it will cause console errors; in this case we initialize it to a blank editor (even
    // though its inaccessible) in order to prevent errors on-load and when first checking that subtab
    if (!this.editor) {
      this.setUpContainer();
      this.setUpEditor();
    }
    this.editor.setValue("");
    this.editor.clearHistory();
    this.editor.clearGutter("gutterId");
  },
  // Used to return back to the same line the editor was on from before switching tabs
  savedVertPos: 0,
};

</script>

<template>
  <div
    ref="container"
    class="c-automator-editor l-automator-editor l-automator-pane__content"
  />
</template>
