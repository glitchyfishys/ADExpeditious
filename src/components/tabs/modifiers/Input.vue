<script>
import { AutobuyerInputFunctions } from "../autobuyers/AutobuyerInput.vue";

export default {
  name: "Input",
  props: {
    modKey: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true
    },
  },
  data() {
    return {
      isValid: true,
      isFocused: false,
      displayValue: "1",
      inSpeedrun: true,
    };
  },
  computed: {
    typeFunctions() {
      const functions = AutobuyerInputFunctions[this.type];
      if (functions === undefined) {
        throw new Error("Unknown input type");
      }
      return functions;
    },
    inputType() {
      return this.type === "int" ? "number" : "text";
    },
    validityClass() {
      return {
        "o-autobuyer-input--invalid": !this.isValid,
        "locked": this.inSpeedrun,
      };
    },
    name(){
      return Speedrun.modifierNames[this.modKey];
    }
  },
  methods: {
    update() {
      this.inSpeedrun = player.speedrun.hasStarted;
      if (this.isFocused) return;
      this.updateActualValue();
    },
    updateActualValue() {
      const actualValue = Speedrun.modifiers[this.modKey];
      if (this.areEqual(this.actualValue, actualValue)) return;
      this.actualValue = actualValue;
      this.updateDisplayValue();
    },
    areEqual(value, other) {
      if (other === undefined || value === undefined) return false;
      return this.typeFunctions.areEqual(value, other);
    },
    updateDisplayValue() {
      this.displayValue = this.actualValue;
    },
    handleInput(event) {
      const input = event.target.value;
      this.displayValue = input;
      if (input.length === 0) {
        this.isValid = false;
        return;
      }
      const parsedValue = AutobuyerInputFunctions[this.type].tryParse(input);
      this.isValid = parsedValue !== undefined;
      this.actualValue = this.typeFunctions.copyValue(parsedValue);
    },
    handleFocus() {
      this.isFocused = true;
    },
    handleChange(event) {
      if (this.isValid) {
        Speedrun.modifiersSet(this.actualValue, this.modKey);
      } else {
        this.updateActualValue();
      }
      this.updateDisplayValue();
      this.isValid = true;

      this.isFocused = false;
      event.target.blur();
    },
  }
};

</script>

<template>
  <div>
    <span style="font-size: 16px">
      {{ name }}:
    </span>
    <input
      :value="displayValue"
      :class="validityClass"
      :type="inputType"
      :disabled="inSpeedrun"
      class="o-autobuyer-input"
      @change="handleChange"
      @focus="handleFocus"
      @input="handleInput"
    >
  </div>
</template>

<style scoped>
.o-autobuyer-input--invalid {
  background-color: var(--color-bad);
}

.s-base--dark .o-autobuyer-input--invalid,
.t-s1 .o-autobuyer-input--invalid {
  background-color: var(--color-bad);
}

.locked {
  border-color: #ffffff;
}
</style>
