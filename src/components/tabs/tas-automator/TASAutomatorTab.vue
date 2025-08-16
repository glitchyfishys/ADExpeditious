<script>
import SplitPane from "vue-splitpane";

import TASAutomatorDocs from "./TASAutomatorDocs";
import TASAutomatorEditor from "./TASAutomatorEditor";

export default {
  name: "TASAutomatorTab",
  components: {
    SplitPane,
    TASAutomatorEditor,
    TASAutomatorDocs
  },
  data() {
    return {
      currentChars: 0,
      totalChars: 0,
      withinLimit: false,
      CPT: 0,
    };
  },
  computed: {
    fullScreen() {
      return this.$viewModel.tabs.TASAutomator.fullScreen;
    },
    tabClass() {
      if (!this.fullScreen) return undefined;
      return "c-automator-tab--full-screen";
    },
    fullScreenIconClass() {
      return this.fullScreen ? "fa-compress-arrows-alt" : "fa-expand-arrows-alt";
    },
    maxScriptChars() {
      return TASAutomatorData.MAX_ALLOWED_SCRIPT_CHARACTERS;
    },
    maxTotalChars() {
      return TASAutomatorData.MAX_ALLOWED_TOTAL_CHARACTERS;
    },
  },
  methods: {
    update() {
      this.currentChars = TASAutomatorData.singleScriptCharacters();
      this.totalChars = TASAutomatorData.totalScriptCharacters();
      this.withinLimit = TASAutomatorData.isWithinLimit();
      this.CPT = TASAutomatorBackend.comandsPerUpdate;
    }
  }
};
</script>

<template>
  <div
    :class="tabClass"
    class="c-automator-tab l-automator-tab"
  >
    <div>
      <div>
        {{ `The TAS Automator is running at ${formatInt(CPT)} commands per Game Tick.` }}
      </div>
      <span :class="{ 'c-overlimit': currentChars > maxScriptChars }">
        This script: {{ formatInt(currentChars) }} / {{ formatInt(maxScriptChars) }}
      </span>
      |
      <span :class="{ 'c-overlimit': totalChars > maxTotalChars }">
        Across all scripts: {{ formatInt(totalChars) }} / {{ formatInt(maxTotalChars) }}
      </span>
      <br>
      <span
        v-if="!withinLimit"
        class="c-overlimit"
      >
        (Your changes will not be saved due to being over a character limit!)
      </span>
      <div class="c-automator-split-pane">
        <SplitPane
          :min-percent="44"
          :default-percent="50"
          split="vertical"
        >
          <template #paneL>
            <TASAutomatorEditor />
          </template>
          <template #paneR>
            <TASAutomatorDocs />
          </template>
        </SplitPane>
      </div>
    </div>
  </div>
</template>

<style scoped>
.c-overlimit {
  font-weight: bold;
  color: var(--color-bad);
}

.c-automator-tab {
  width: 80%;
  min-width: 100rem;
}

.l-automator-tab {
  position: relative;
  align-self: center;
  margin-top: 0.5rem;
}

.c-automator-split-pane {
  width: 100%;
  height: 57rem;
  background-color: #bbbbbb;
}

.s-base--dark .c-automator-split-pane {
  width: 100%;
  background-color: #474747;
}

.c-automator-tab--full-screen .c-automator-split-pane {
  width: 100%;
  height: 100%;
  position: fixed;
  inset: 0;
  z-index: 5;
  margin-top: 0;
  padding-bottom: 0;
}
</style>
