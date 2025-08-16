<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "DeleteTASScriptModal",
  components: {
    ModalWrapperChoice
  },
  props: {
    scriptID: {
      type: [String, Number],
      required: true
    }
  },
  methods: {
    handleYesClick() {
      const script = this.scriptID;
      const runningScriptID = TASAutomatorBackend.state.topLevelScript;

      TASAutomatorBackend.deleteScript(script);

      const scriptList = Object.values(player.speedrun.TASAutomator.scripts).map(sc => ({
        id: sc.id,
        name: sc.name,
      }));
      if (TASAutomatorBackend.isOn && runningScriptID !== script) {
        player.speedrun.TASAutomator.state.editorScript = runningScriptID;
      } else {
        // TASAutomatorBackend.deleteScript will create an empty script if necessary
        player.speedrun.TASAutomator.state.editorScript = scriptList[0].id;
      }
      TASAutomatorData.clearUndoData();
      EventHub.dispatch(GAME_EVENT.AUTOMATOR_SAVE_CHANGED);
    },
  },
};
</script>

<template>
  <ModalWrapperChoice @confirm="handleYesClick">
    <template #header>
      Delete this script
    </template>
    <div class="c-modal-message__text">
      Please confirm your desire to delete this TAS script.
    </div>
    <template #confirm-text>
      Delete
    </template>
  </ModalWrapperChoice>
</template>
