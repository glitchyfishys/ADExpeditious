<script>
import TASAutomatorControls from "./TASAutomatorControls";
import TASAutomatorTextEditor from "./TASAutomatorTextEditor";

export default {
  name: "TASAutomatorEditor",
  components: {
    TASAutomatorTextEditor,
    TASAutomatorControls,
  },
  data() {
    return {
      automatorType: 0,
    };
  },
  computed: {
    currentScriptID: {
      get() {
        return this.$viewModel.tabs.TASAutomator.editorScriptID;
      },
      set(value) {
        this.$viewModel.tabs.TASAutomator.editorScriptID = value;
      }
    },
    currentScriptContent() {
      return player.speedrun.TASAutomator.scripts[this.currentScriptID].content;
    },
    currentScript() {
      return CodeMirror.Doc(this.currentScriptContent, "TAS").getValue();
    },
    isTextAutomator() {
      return this.automatorType === AUTOMATOR_TYPE.TEXT;
    },
  },
  created() {
    this.on$(GAME_EVENT.GAME_LOAD, () => this.onGameLoad());
    this.on$(GAME_EVENT.AUTOMATOR_SAVE_CHANGED, () => this.onGameLoad());
    this.updateCurrentScriptID();
  },
  methods: {
    update() {
      this.automatorType = player.speedrun.TASAutomator.type;
      if (!TASAutomatorBackend.isOn && TASAutomatorTextUI.editor && TASAutomatorData.needsRecompile) {
        TASAutomatorTextUI.editor.performLint();
      }
    },
    onGameLoad() {
      this.updateCurrentScriptID();
    },
    updateCurrentScriptID() {
      const storedScripts = player.speedrun.TASAutomator.scripts;
      this.currentScriptID = player.speedrun.TASAutomator.state.editorScript;
      // This shouldn't happen if things are loaded in the right order, but might as well be sure.
      if (storedScripts[this.currentScriptID] === undefined) {
        this.currentScriptID = Number(Object.keys(storedScripts)[0]);
        player.speedrun.TASAutomator.state.editorScript = this.currentScriptID;
        TASAutomatorData.clearUndoData();
      }
    },
  }
};
</script>

<template>
  <div class="l-automator-pane">
    <TASAutomatorControls />
    <TASAutomatorTextEditor
      :current-script-id="currentScriptID"
    />
  </div>
</template>

<style scoped>
.c-slider-toggle-button {
  display: flex;
  overflow: hidden;
  position: relative;
  align-items: center;
  color: black;
  background-color: #626262;
  border: 0.2rem solid #767676;
  border-radius: 0.2rem;
  margin: 0.4rem;
  padding: 0.3rem 0;
  cursor: pointer;
}

.s.base--dark .c-slider-toggle-button {
  background-color: #626262;
}

.c-slider-toggle-button .fas {
  width: 3rem;
  position: relative;
  z-index: 1;
}

.c-slider-toggle-button:before {
  content: "";
  width: 3rem;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  background-color: white;
  border-radius: 0.2rem;
  transition: 0.3s ease all;
}

.c-slider-toggle-button--right:before {
  left: 3rem;
  background-color: white;
}

.tutorial--glow:after {
  z-index: 2;
}
</style>
