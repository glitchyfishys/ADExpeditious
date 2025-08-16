<script>

import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "ImportTASModal",
  components: {
    ModalWrapperChoice,
  },
  data() {
    return {
      input: "",
      isValid: false,
      scriptName: "",
      scriptContent: "",
      lineCount: 0,
    };
  },
  mounted() {
    this.$refs.input.select();
  },
  methods: {
    update() {
      // We need to sequentially parse full data and then single script data in order to handle both in the same modal.
      // Parsing order doesn't matter due to the fact that export formatting means it's only ever one or the other.
      let parsed = TASAutomatorBackend.parseScriptContents(this.input);
      if (!parsed) {
        this.isValid = false;
        return;
      }

      this.scriptName = parsed.name;
      this.scriptContent = parsed.content;
      this.lineCount = this.scriptContent.split("\n").length;
      this.isValid = true;
    },
    importSave() {
      if (!this.isValid) return;
      TASAutomatorBackend.importScriptContents(this.input);
      this.emitClose();
    },
  },
};
</script>

<template>
  <ModalWrapperChoice
    :show-cancel="!isValid"
    :show-confirm="isValid"
    @confirm="importSave"
  >
    <template #header>
      Import TAS Automator Script Data
    </template>
      This will create a new TAS script at the end of your list.
    <input
      ref="input"
      v-model="input"
      type="text"
      class="c-modal-input c-modal-import__input"
      @keyup.enter="importSave"
      @keyup.esc="emitClose"
    >
    <div v-if="isValid">
      Script name: {{ scriptName }}
      <br>
      Line count: {{ lineCount }}
      <br>
    </div>
    <div v-else-if="input.length !== 0">
      Invalid TAS Automator string
    </div>
    <template #confirm-text>
      Import
    </template>
  </ModalWrapperChoice>
</template>

<style scoped>
.l-has-errors {
  color: red;
}

.c-import-data-name {
  padding: 0 1rem;
}
</style>
