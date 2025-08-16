<script>
import TASAutomatorButton from "./TASAutomatorButton";

export default {
  name: "TASAutomatorControls",
  components: {
    TASAutomatorButton
  },
  data() {
    return {
      isRunning: false,
      isPaused: false,
      repeatOn: false,
      justCompleted: false,
      forceRestartOn: false,
      followExecution: false,
      hasErrors: false,
      currentLine: 0,
      statusName: "",
      editingName: "",
      editingDifferentScript: false,
      currentChars: 0,
      hasUndo: false,
      hasRedo: false,
    };
  },
  computed: {
    fullScreen() {
      return this.$viewModel.tabs.TASAutomator.fullScreen;
    },
    currentScriptID() {
      return this.$viewModel.tabs.TASAutomator.editorScriptID;
    },
    playTooltip() {
      if (this.isPaused) return "Resume Automator execution";
      if (!this.isRunning) return "Start Automator";
      return "Pause Automator execution";
    },
    playButtonClass() {
      return {
        "c-automator__button--active": this.isRunning,
        "fa-play": !this.isRunning && !this.isPaused,
        "fa-pause": this.isRunning,
        "fa-eject": this.isPaused
      };
    },
    statusText() {
      // Pad with leading zeroes based on script length to prevent text jitter on fast scripts. This technically fails
      // for scripts with more than 99999 lines, but scripts that long will be prevented elsewhere
      const digits = Math.clampMin(Math.ceil(Math.log10(TASAutomatorBackend.currentScriptLength + 1)), 1);
      let lineNum = `0000${this.currentLine}`;
      lineNum = lineNum.slice(lineNum.length - digits);

      if (this.isPaused) return `Paused: "${this.statusName}" (Resumes on Line ${lineNum})`;
      if (this.isRunning) return `Running: "${this.statusName}" (Line ${lineNum})`;
      if (this.hasErrors) return `Stopped: "${this.statusName}" has errors (Cannot run)`;
      return `Stopped: Will start running "${this.statusName}"`;
    },
    maxScriptChars() {
      return TASAutomatorData.MAX_ALLOWED_SCRIPT_CHARACTERS;
    },
  },
  methods: {
    update() {
      this.isRunning = TASAutomatorBackend.isRunning;
      this.isPaused = TASAutomatorBackend.isOn && !this.isRunning;
      this.repeatOn = TASAutomatorBackend.state.repeat;
      this.justCompleted = TASAutomatorBackend.hasJustCompleted;
      this.forceRestartOn = TASAutomatorBackend.state.forceRestart;
      this.followExecution = TASAutomatorBackend.state.followExecution;
      this.hasErrors = TASAutomatorData.cachedErrors !== 0;
      this.currentLine = TASAutomatorBackend.currentLineNumber;

      // When the automator isn't running, the script name contains the last run script instead of the
      // to-be-run script, which is the currently displayed one in the editor
      this.statusName = (this.isPaused || this.isRunning)
        ? TASAutomatorBackend.scriptName
        : TASAutomatorBackend.currentEditingScript.name;
      this.duplicateStatus = TASAutomatorBackend.hasDuplicateName(this.statusName);
      this.editingDifferentScript = (this.isRunning || this.isPaused) &&
        TASAutomatorBackend.currentEditingScript.id !== TASAutomatorBackend.currentRunningScript.id;

      this.currentChars = TASAutomatorData.singleScriptCharacters();
      this.hasUndo = TASAutomatorData.undoBuffer.length > 0;
      this.hasRedo = TASAutomatorData.redoBuffer.length > 0;
    },
    rewind: () => TASAutomatorBackend.restart(),
    play() {
      TASAutomatorBackend.compile();
      if (TASAutomatorData.cachedErrors > 0) {
        TASAutomatorBackend.mode = AUTOMATOR_MODE.PAUSE;
        return;
      }
      if (this.isRunning) {
        TASAutomatorBackend.pause();
        return;
      }
      if (TASAutomatorBackend.isOn) TASAutomatorBackend.mode = AUTOMATOR_MODE.RUN;
      else TASAutomatorBackend.start(TASAutomatorBackend.currentEditingScript.id, AUTOMATOR_MODE.RUN, false);
    },
    stop: () => TASAutomatorBackend.stop(),
    step() {
      TASAutomatorBackend.compile();
      if (TASAutomatorData.cachedErrors > 0) TASAutomatorBackend.mode = AUTOMATOR_MODE.PAUSE;
      else if (TASAutomatorBackend.isOn) TASAutomatorBackend.mode = AUTOMATOR_MODE.SINGLE_STEP;
      else TASAutomatorBackend.start(TASAutomatorBackend.currentEditingScript.id, AUTOMATOR_MODE.SINGLE_STEP, false);
    },
    repeat: () => TASAutomatorBackend.toggleRepeat(),
    restart: () => TASAutomatorBackend.toggleForceRestart(),
    follow: () => TASAutomatorBackend.toggleFollowExecution(),
    undo: () => TASAutomatorData.undoScriptEdit(),
    redo: () => TASAutomatorData.redoScriptEdit(),
  }
};
</script>

<template>
  <div class="c-automator__controls l-automator__controls">
    <div class="c-automator-control-row l-automator-button-row">
      <div class="c-button-group">
        <TASAutomatorButton
          v-tooltip="'Rewind Automator to the first command'"
          class="fa-fast-backward"
          @click="rewind"
        />
        <TASAutomatorButton
          v-tooltip="{
            content: playTooltip,
            hideOnTargetClick: false
          }"
          :class="playButtonClass"
          @click="play"
        />
        <TASAutomatorButton
          v-tooltip="'Stop Automator and reset position'"
          class="fa-stop"
          @click="stop"
        />
        <TASAutomatorButton
          v-tooltip="'Step forward one line'"
          class="fa-step-forward"
          @click="step"
        />
        <TASAutomatorButton
          v-tooltip="'Restart script automatically when it reaches the end'"
          class="fa-sync-alt"
          :class="{ 'c-automator__button--active' : repeatOn }"
          @click="repeat"
        />
        <TASAutomatorButton
          v-tooltip="'Automatically restart the active script when finishing or restarting a Reality'"
          class="fa-reply"
          :class="{ 'c-automator__button--active' : forceRestartOn }"
          @click="restart"
        />
        <TASAutomatorButton
          v-tooltip="'Scroll Automator to follow current line'"
          class="fa-indent"
          :class="{ 'c-automator__button--active' : followExecution }"
          @click="follow"
        />
        <span
          v-if="fullScreen"
          class="c-automator__status-text c-automator__status-text--small"
          :class="{ 'c-automator__status-text--error' : currentChars > maxScriptChars }"
        >
          This script: {{ formatInt(currentChars) }}/{{ formatInt(maxScriptChars) }}
        </span>
      </div>
      <div class="c-button-group">
        <TASAutomatorButton
          v-tooltip="'Undo'"
          class="fa-arrow-rotate-left"
          :class="{ 'c-automator__button--inactive' : !hasUndo }"
          @click="undo"
        />
        <TASAutomatorButton
          v-tooltip="'Redo'"
          class="fa-arrow-rotate-right"
          :class="{ 'c-automator__button--inactive' : !hasRedo }"
          @click="redo"
        />
      </div>
    </div>
    <div class="l-automator-button-row">
      <span
        v-if="duplicateStatus"
        v-tooltip="'More than one script has this name!'"
        class="fas fa-exclamation-triangle c-automator__status-text c-automator__status-text--error"
      />
      <span
        v-if="editingDifferentScript"
        v-tooltip="'The automator is running a different script than the editor is showing'"
        class="fas fa-circle-exclamation c-automator__status-text c-automator__status-text--warning"
      />
      <span
        v-if="justCompleted"
        v-tooltip="'The automator completed running the previous script'"
        class="fas fa-circle-check c-automator__status-text"
      />
      <span
        class="c-automator__status-text"
        :class="{ 'c-automator__status-text--error' : hasErrors && !(isRunning || isPaused) }"
      >
        {{ statusText }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.c-automator-control-row {
  justify-content: space-between;
}

.c-button-group {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.c-automator__status-text {
  font-size: 1.3rem;
  font-weight: bold;
  color: var(--color-reality);
  padding: 0 0.5rem;
}

.c-automator__status-text--small {
  font-size: 1.1rem;
}

.c-automator__status-text--warning {
  color: var(--color-good-paused);
}

.c-automator__status-text--error {
  color: var(--color-bad);
}

.c-automator__button--active {
  background-color: var(--color-automator-controls-active);
  border-color: var(--color-reality-light);
}

.c-automator__button--inactive {
  background-color: var(--color-automator-controls-border);
  border-color: var(--color-reality-light);
}

.c-automator__button.fa-eject::before {
  transform: rotate(90deg);
}
</style>
