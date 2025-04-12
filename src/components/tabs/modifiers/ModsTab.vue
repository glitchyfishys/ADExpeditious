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
      gameSpeedAch: true,
      glyphsHaveFourEffects: false,
      effarigGlyphsHaveAllEffects: false,
      glyphsHaveMaxRarity: false,
      vAchAreEasy: false,
      win: false,
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
    },
    gameSpeedAch(value){
      this.mods.gameSpeedAch = value;
    },
    win(value){
      player.celestials.pelle.doomed = true;
      player.antimatter = new Decimal('Infinity');
      dev.giveAllNormalAchievements();
    },
    glyphsHaveFourEffects(value){
      this.mods.glyphsHaveFourEffects = value;
    },
    effarigGlyphsHaveAllEffects(value){
      this.mods.effarigGlyphsHaveAllEffects = value;
    },
    glyphsHaveMaxRarity(value){
      this.mods.glyphsHaveMaxRarity = value;
    },
    vAchAreEasy(value){
      this.mods.vAchAreEasy = value;
    }

  },
  methods: {
    update(){
      this.chalAch = player.speedrun.mods.chalAch;
      this.DTAuto = player.speedrun.mods.realTimeSpeedAutobuyers;
      this.gameSpeedAch = player.speedrun.mods.gameSpeedAch;
      this.glyphsHaveFourEffects = player.speedrun.mods.glyphsHaveFourEffects;
      this.effarigGlyphsHaveAllEffects = player.speedrun.mods.effarigGlyphsHaveAllEffects;
      this.glyphsHaveMaxRarity = player.speedrun.mods.glyphsHaveMaxRarity;
      this.speedrun = {isRunning: Speedrun.isRunning, isPausedAtStart: Speedrun.isPausedAtStart};
    },
    doubleEverything(value){
      dev.doubleEverything(value);
    },
    giveAllAchievements(){
      dev.giveAllNormalAchievements();
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
    <div class="o-subsect">  <!-- Dimensions  -->
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

    <div class="o-subsect">  <!-- Presteage  -->
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

    <div class="o-subsect">  <!-- GameSpeed  -->
      <div style="border: solid var(--color-reality-light) 2px; width: 100%">
        <div class="text-big"> Game Speed </div>
        <Input
        :modKey="'realTimeSpeed'"
        :type="'float'"
        /><br>
        <Input
        :modKey="'gameSpeed'"
        :type="'float'"
        /><br>
        <div>
          <PrimaryToggleButton
          v-model="gameSpeedAch"
          :on="'Achievements effect game speed: enabled'"
          :off="'Achievements effect game speed: disabled'"
          :disabled="speedrun.isRunning"
          :class="speedrun.isRunning ? 'disabled c-button' : 'c-button'"
          />
        </div><br>
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
    <div class="o-subsect">  <!-- Glyphs  -->
      <div style="border: solid rgb(254, 174, 201) 2px; width: 100%">
        <div class="text-big"> Glyphs </div>
        <Input
        :modKey="'glyphRarity'"
        :type="'float'"
        /><br>
        <Input
        :modKey="'glyphLevel'"
        :type="'float'"
        /><br>
        <Input
        :modKey="'glyphAlcCap'"
        :type="'float'"
        /><br>
        <Input
        :modKey="'glyphAlcMul'"
        :type="'float'"
        /><br>
        <div>
          <PrimaryToggleButton
          v-model="glyphsHaveFourEffects"
          :on="'Glyphs always have four effects: Enabled'"
          :off="'Glyphs always have four effects: Disabled'"
          :disabled="speedrun.isRunning"
          :class="speedrun.isRunning ? 'disabled c-button' : 'c-button'"
          />
        </div><br>
        <div>
          <PrimaryToggleButton
          v-model="effarigGlyphsHaveAllEffects"
          :on="'Effarig glyphs can have seven effects: Enabled'"
          :off="'Effarig glyphs can have seven effects: Disabled'"
          :disabled="speedrun.isRunning"
          :class="speedrun.isRunning ? 'disabled c-button' : 'c-button'"
          />
        </div><br>
        <div>
          <PrimaryToggleButton
          v-model="glyphsHaveMaxRarity"
          :on="'Glyphs have max rarity: Enabled'"
          :off="'Glyphs have max rarity: Disabled'"
          :disabled="speedrun.isRunning"
          :class="speedrun.isRunning ? 'disabled c-button' : 'c-button'"
          />
        </div><br>
      </div>
    </div>
    <div class="o-subsect">  <!-- Celestials  -->
      <div style="border: solid var(--color-teresa--base) 2px">
        <div class="text-big">Teresa </div>
        <Input
        :modKey="'teresaSacMul'"
        :type="'float'"
        /><br>
      </div>
      <div style="border: solid var(--color-effarig--base) 2px">
          <div class="text-big">Effarig
            <Input
            :modKey="'effarigRelicMul'"
            :type="'float'"
            /><br>
          </div>
      </div>
      <div style="border: solid var(--color-enslaved--base) 2px">
          <div class="text-big">Nameless
            <Input
            :modKey="'namelessRealTimeMul'"
            :type="'float'"
            /><br>
          </div>
      </div>
      <div style="border: solid var(--color-v--base) 2px">
          <div class="text-big">V
            <div>
              <PrimaryToggleButton
              v-model="vAchAreEasy"
              :on="'V Achievements Are Easy: Enabled'"
              :off="'V Achievements Are Easy: Disabled'"
              :disabled="speedrun.isRunning"
              :class="speedrun.isRunning ? 'disabled c-button' : 'c-button'"
              />
            </div><br>
          </div>
      </div>
      <div style="border: solid var(--color-ra--base) 2px">
          <div class="text-big">Ra
            <Input
            :modKey="'raMemoryMul'"
            :type="'float'"
            /><br>
            <Input
            :modKey="'raChunkMul'"
            :type="'float'"
            /><br>
          </div>
      </div>
      <div style="border: solid var(--color-laitela--base) 2px">
          <div class="text-big">Laitela
            <Input
            :modKey="'laitelaDMDMul'"
            :type="'float'"
            /><br>
            <Input
            :modKey="'laitelaSingularityMul'"
            :type="'float'"
            /><br>
            <Input
            :modKey="'laitelaDEMul'"
            :type="'float'"
            /><br>
            <Input
            :modKey="'laitelaDMMul'"
            :type="'float'"
            /><br>
            <Input
            :modKey="'laitelaAnnilationMul'"
            :type="'float'"
            /><br>
          </div>
      </div>
      <div style="border: solid var(--color-pelle--base) 2px">
          <div class="text-big">Pelle
            <Input
            :modKey="'pelleRemnantMul'"
            :type="'float'"
            /><br>
            <Input
            :modKey="'pelleRealityShardMul'"
            :type="'float'"
            /><br>
          </div>
      </div>
    </div>
    <div class="o-subsect">  <!-- Achivements  -->
      <div style="border: solid #ffee58 2px; width: 100%">
        <div class="text-big"> Achievements </div>
        <div>
          <PrimaryToggleButton
          v-model="chalAch"
          :on="'Easy Challenge Achievements: Enabled'"
          :off="'Easy Challenge Achievements: Disabled'"
          :disabled="speedrun.isRunning"
          :class="speedrun.isRunning ? 'disabled c-button' : 'c-button'"
          />
        </div><br>
        <PrimaryButton
          @click="giveAllAchievements()"
          :disabled="speedrun.isRunning"
          :class="speedrun.isPausedAtStart() ? 'disabled c-button' : 'c-button'"
          >Give all Achivements</PrimaryButton>
          <br>
      </div>
    </div>
    <div class="o-subsect">  <!-- Jokes  -->
      <div style="border: solid #ffcccc 2px; width: 100%">
        <div class="text-big"> Joke Stuff </div>
        <div>
          <PrimaryButton
          v-model="win"
          :disabled="speedrun.isRunning"
          :class="speedrun.isRunning ? 'disabled c-button' : 'c-button'"
          >Win</PrimaryButton>
          <br>
          These will break the game if used too much after Reality
        </div><br>
          <PrimaryButton
          @click="doubleEverything(2)"
          :disabled="speedrun.isRunning"
          :class="speedrun.isRunning ? 'disabled c-button' : 'c-button'"
          >Double Everything</PrimaryButton>

          <PrimaryButton
          @click="doubleEverything(3)"
          :disabled="speedrun.isRunning"
          :class="speedrun.isRunning ? 'disabled c-button' : 'c-button'"
          >Triple Everything</PrimaryButton>

           <PrimaryButton
          @click="doubleEverything(4)"
          :disabled="speedrun.isRunning"
          :class="speedrun.isRunning ? 'disabled c-button' : 'c-button'"
          >Quadtuple Everything</PrimaryButton>

          <PrimaryButton
          @click="doubleEverything(5)"
          :disabled="speedrun.isRunning"
          :class="speedrun.isRunning ? 'disabled c-button' : 'c-button'"
          >Quintuple Everything</PrimaryButton>
          <br>
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
  flex-wrap: wrap;
  border: solid #555555 8px;
  width: 100%;
}

.disabled {
  border-color: #ffffff;
  background-color: #222222;
}

</style>
