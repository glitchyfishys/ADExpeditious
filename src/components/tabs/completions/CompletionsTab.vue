<script>
import OpenModalHotkeysButton from "@/components/OpenModalHotkeysButton";
import OptionsButton from "@/components/OptionsButton";
import PrimaryToggleButton from "@/components/PrimaryToggleButton";
import SliderComponent from "@/components/SliderComponent";
import PastCompsContainer from "./PastCompsContainer";
import NameInput from "./NameInput";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "CompletionsTab",
  components: {
    OpenModalHotkeysButton,
    OptionsButton,
    PrimaryToggleButton,
    SliderComponent,
    PastCompsContainer,
    NameInput,
    PrimaryButton
  },
  data() {
    return {
      gameCompletions: 0,
      completion: {
        name: 'Completion',
        hasBest: false,
        best: TimeSpan.zero,
        this: TimeSpan.zero,
        thisReal: TimeSpan.zero,
        bestReal: TimeSpan.zero,
      },
      Lcompletion: {
        name: "Completion",
        plural: "Completions",
        condition: () => player.records.fullGameCompletions > 0,
        getRuns: () => player.records.recentCompletions
      }
    };
  },
  computed: {
    
  },
  methods: {
    update() {
      const records = player.records;
      const completions = this.completion;
      const bestCompletion = records.bestCompletion;
      completions.hasBest = bestCompletion.time < 99999999999;
      completions.best.setFrom(bestCompletion.time);
      completions.this.setFrom(records.thisCompletion.time);
      completions.thisReal.setFrom(records.thisCompletion.realTime);
      completions.bestReal.setFrom(records.bestCompletion.realTime);

      this.gameCompletions = player.records.fullGameCompletions;
    },
    start(){
      Speedrun.prepareSave(player.speedrun.name);
    }
  }
};
</script>

<template>
  <div class="l-completions-tab">
    <br>
    <div class="c-completions-text">
    You completed the game <span class="c-completions-text_accent">{{ format(gameCompletions) }}</span> time(s).
    </div>
    <div class="c-stats-tab-title c-stats-tab-general">
        Stuff
      </div>
      <div class="c-best-runs-text">
        Your fastest Completion was {{ completion.bestReal.toString() }}. (real time)
      </div>
      <div class="c-this-runs-text">
        You have spent {{ completion.this.toStringShort() }} in this full game run in game time.<br>
        You have spent {{ completion.thisReal.toStringShort() }} in this full game run in real time.
      </div>
      Speedrun Name: <NameInput /><br>
      <PrimaryButton
      @click="start"
      class="speedrun"
      >
        Start Speedrun
      </PrimaryButton><br>
      <PastCompsContainer
      :key="Lcompletion.name"
      :comp="Lcompletion"
      />
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
}

.c-best-runs-text, .c-this-runs-text {
  font-size: 1.5rem;
}

.speedrun {
  width: 25rem;
  height: 6rem;
  font-size: 26px;
}
</style>
