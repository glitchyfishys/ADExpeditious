<script>
import Input from "./Input";
import PrimaryButton from "@/components/PrimaryButton";
import PrimaryToggleButton from "@/components/PrimaryToggleButton";

export default {
  name: "ModsTab",
  components: {
    PrimaryToggleButton,
    Input,
    PrimaryButton
  },
  data() {
    return {
      chalAch: false,
      DTAuto: true,
      speedrun: {},
    };
  },
  computed: {
    mods(){
      return player.speedrun.mods;
    },
  },
  watch: {
    chalAch(value){
      this.mods.chalAch = value;
    },
    DTAuto(value){
      this.mods.realTimeSpeedAutobuyers = value;
    }
  },
  methods: {
    update(){
      this.chalAch = player.speedrun.mods.chalAch;
      this.speedrun = {isRunning: Speedrun.isRunning};
    }
  }
};
</script>

<template>
  <div class="l-mods-tab">
    <br>
    <div class="c-stats-tab-title c-stats-tab-general">
      Modifiers
    </div>
    <div class="text-big">Antimatter Dimensions</div>
    <Input
    :modKey="'ADMul'"
    :name="'AD Multiplier'"
    :type="'decimal'"
    />
    <Input
    :modKey="'ADPow'"
    :name="'AD Power'"
    :type="'float'"
    /><br>
    <div class="text-big">Infinity Dimensions</div>
    <Input
    :modKey="'IDMul'"
    :name="'ID Multiplier'"
    :type="'decimal'"
    />
    <Input
    :modKey="'IDPow'"
    :name="'ID Power'"
    :type="'float'"
    /><br>
    <div class="text-big">Time Dimensions</div>
    <Input
    :modKey="'TDMul'"
    :name="'TD Multiplier'"
    :type="'decimal'"
    />
    <Input
    :modKey="'TDPow'"
    :name="'TD Power'"
    :type="'float'"
    /><br>

    <div class="text-big"> Achievements </div>
    <PrimaryToggleButton
    v-model="chalAch"
    :on="'Easy Challenge Achievements Enabled'"
    :off="'Easy Challenge Achievements Disabled'"
    :disabled="speedrun.isRunning"
    :class="speedrun.isRunning ? 'disabled c-button' : 'c-button'"
    /><br>
    <div class="text-big"> Game Speed </div>
    <Input
    :modKey="'realTimeSpeed'"
    :name="'Real Time Speed'"
    :type="'float'"
    /><br>
    <PrimaryToggleButton
    v-model="DTAuto"
    :on="'Delta Time Autobuyers Enabled'"
    :off="'Delta Time Autobuyers Disabled'"
    :disabled="speedrun.isRunning"
    :class="speedrun.isRunning ? 'disabled c-button' : 'c-button'"
    /><br>
  </div>
</template>

<style scoped>
.l-toggle-button {
  font-size: 12px;
}
.c-stats-tab-general {
  color: var(--color-text);
}

.c-stats-tab-title {
  font-size: 3rem;
  font-weight: bold;
  align-self: center;
}

.c-best-runs-text, .c-this-runs-text {
  font-size: 1.5rem;
}

.c-button {
  align-self: center;
}

.l-mods-tab {
  width: 40rem;
  align-content: stretch;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  align-self: center;
}

.text-big {
  font-size: 18px;
  align-self: center;
}

.disabled {
  border-color: #ffffff;
  background-color: #222222;
}

</style>
