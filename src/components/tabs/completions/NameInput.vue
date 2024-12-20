<script>
export default {
  name: "NameInput",
  data() {
    return {
      isValid: true,
      isFocused: false,
      displayValue: "Name",
      inSpeedrun: true,
    };
  },
  computed: {
    inputType() {
      return "text";
    },
    validityClass() {
      return {
        "o-autobuyer-input--invalid": !this.isValid,
        "locked": this.inSpeedrun,
      };
    }
  },
  methods: {
    update() {
      this.inSpeedrun = player.speedrun.hasStarted;
      if (this.isFocused) return;
      this.updateActualValue();
    },
    updateActualValue() {
      const actualValue = player.speedrun.name;
      if (this.areEqual(this.actualValue, actualValue)) return;
      this.actualValue = actualValue;
      this.updateDisplayValue();
    },
    areEqual(value, other) {
      if (other == '' || value == '') return false;
      return value == other;
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
      const parsedValue = input;
      this.isValid = parsedValue !== undefined;
      this.actualValue = parsedValue;
    },
    handleFocus() {
      this.isFocused = true;
    },
    handleChange(event) {
      if (this.isValid) {
        player.speedrun.name = this.actualValue;
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
