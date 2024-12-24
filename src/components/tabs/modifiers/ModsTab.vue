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
    don't go crazy with this, your save might break
    <div class="o-subsect">
      <div style="border: solid var(--color-antimatter) 2px">
        <div class="text-big">Antimatter Dimensions</div>
        <Input
    :modKey="'ADMul'"
    :type="'decimal'"
        />
        <Input
    :modKey="'ADPow'"
    :type="'float'"
        /><br>
      </div>
      <div style="border: solid var(--color-infinity) 2px">
        <div class="text-big">Infinity Dimensions</div>
        <Input
    :modKey="'IDMul'"
    :type="'decimal'"
        />
        <Input
    :modKey="'IDPow'"
    :type="'float'"
        /><br>
      </div>
      <div style="border: solid var(--color-eternity) 2px">
        <div class="text-big">Time Dimensions</div>
        <Input
        :modKey="'TDMul'"
        :type="'decimal'"
        />
        <Input
        :modKey="'TDPow'"
        :type="'float'"
        /><br>
      </div>
    </div>

    <div class="o-subsect">
      <div style="border: solid var(--color-infinity) 2px">
        <div class="text-big">Infinity</div>
        <Input
        :modKey="'IPMul'"
        :type="'decimal'"
        />
        <Input
        :modKey="'IPPow'"
        :type="'float'"
        /><br>

        <Input
        :modKey="'InfMul'"
        :type="'decimal'"
        />
        <Input
        :modKey="'InfPow'"
        :type="'float'"
        /><br>
        <Input
        :modKey="'RepMul'"
        :type="'decimal'"
        />
        <Input
        :modKey="'RepPow'"
        :type="'float'"
        /><br>
      </div>

      <div style="border: solid var(--color-eternity) 2px">
        <div class="text-big">Eternity</div>
        <Input
        :modKey="'EPMul'"
        :type="'decimal'"
        />
        <Input
        :modKey="'EPPow'"
        :type="'float'"
        /><br>

        <Input
        :modKey="'EtrMul'"
        :type="'decimal'"
        />
        <Input
        :modKey="'EtrPow'"
        :type="'float'"
        /><br>
        <Input
        :modKey="'TPMul'"
        :type="'decimal'"
        />
        <Input
        :modKey="'TPPow'"
        :type="'float'"
        /><br>
        <Input
        :modKey="'DTMul'"
        :type="'decimal'"
        />
        <Input
        :modKey="'DTPow'"
        :type="'float'"
        /><br>
      </div>

      <div style="border: solid var(--color-reality) 2px">
        <div class="text-big">Reality</div>
        <Input
        :modKey="'RMMul'"
        :type="'decimal'"
        />
        <Input
        :modKey="'RMPow'"
        :type="'float'"
        /><br>

        <Input
        :modKey="'RealCapMul'"
        :type="'decimal'"
        />
        <Input
        :modKey="'RealCapPow'"
        :type="'float'"
        /><br>

        <Input
        :modKey="'IMCapMul'"
        :type="'float'"
        />
        <Input
        :modKey="'IMCapPow'"
        :type="'float'"
        /><br>

        <Input
        :modKey="'RealMul'"
        :type="'float'"
        />
        <Input
        :modKey="'RealPow'"
        :type="'float'"
        /><br>
      </div>
    </div>

    <div class="o-subsect">
      <div style="border: solid var(--color-reality-light) 2px; width: 100%">
        <div class="text-big"> Game Speed </div>
        <Input
        :modKey="'realTimeSpeed'"
        :type="'float'"
        /><br>
        <div>
          <PrimaryToggleButton
          v-model="DTAuto"
          :on="'Delta Time Autobuyers Enabled'"
          :off="'Delta Time Autobuyers Disabled'"
          :disabled="speedrun.isRunning"
          :class="speedrun.isRunning ? 'disabled c-button' : 'c-button'"
          />
        </div><br>
      </div>
    </div>
    <div class="o-subsect">
      <div style="border: solid #ffee58 2px; width: 100%">
        <div class="text-big"> Achievements </div>
        <div>
          <PrimaryToggleButton
          v-model="chalAch"
          :on="'Easy Challenge Achievements Enabled'"
          :off="'Easy Challenge Achievements Disabled'"
          :disabled="speedrun.isRunning"
          :class="speedrun.isRunning ? 'disabled c-button' : 'c-button'"
          />
        </div><br>
      </div>
    </div>
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
  padding-bottom: 15rem;
  align-content: stretch;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: center;
}

.text-big {
  font-size: 18px;
  align-self: center;
}

.o-subsect {
  display: flex;
  justify-content: space-evenly;
  align-items: stretch;
  border: solid #555555 8px;
  width: 100%;
}

.disabled {
  border-color: #ffffff;
  background-color: #222222;
}

</style>
