import { GameDatabase } from "./secret-formula/game-database";
import { GameMechanicState } from "./game-mechanics";
import { DC } from "./constants";

export const Speedrun = {
  officialFixedSeed: 69420,
  unlock() {
    if (player.speedrun.isUnlocked) return;
    Modal.message.show(`You have unlocked Speedrun Mode! This allows you to start a new save file with some slight
      changes which can be helpful if you're trying to complete the game as quickly as possible. The option to
      start a Speedrun Save is now available in the Options tab, under Saving. Choosing to start a Speedrun Save
      will provide you with another modal with more in-depth information.`, {}, 3);
    player.speedrun.isUnlocked = true;
  },
  // Used to block the seed-changing modal from opening (other functions assume this is checked beforehand)
  canModifySeed() {
    return player.realities < 1;
  },
  modifySeed(key, seed) {
    player.speedrun.seedSelection = key;
    let newSeed;
    switch (key) {
      case SPEEDRUN_SEED_STATE.FIXED:
        player.reality.initialSeed = this.officialFixedSeed;
        player.speedrun.initialSeed = this.officialFixedSeed;
        return;
      case SPEEDRUN_SEED_STATE.RANDOM:
        // This gives seeds of roughly the same magnitude that the first-run Date.now() would give
        newSeed = Math.floor(1e13 * Math.random());
        player.reality.initialSeed = newSeed;
        player.speedrun.initialSeed = newSeed;
        return;
      case SPEEDRUN_SEED_STATE.PLAYER:
        player.reality.initialSeed = seed;
        player.speedrun.initialSeed = seed;
        return;
      default:
        throw new Error("Unrecognized speedrun seed setting option");
    }
  },
  seedModeText(rec) {
    const record = rec ?? player.speedrun;
    switch (record.seedSelection) {
      case SPEEDRUN_SEED_STATE.UNKNOWN:
        return `No seed data (old save)`;
      case SPEEDRUN_SEED_STATE.FIXED:
        return `Official fixed seed (${record.initialSeed})`;
      case SPEEDRUN_SEED_STATE.RANDOM:
        return `Random seed (${record.initialSeed})`;
      case SPEEDRUN_SEED_STATE.PLAYER:
        return `Player seed (${record.initialSeed})`;
      default:
        throw new Error("Unrecognized speedrun seed option in seedModeText");
    }
  },
  // If a name isn't given, choose a somewhat-likely-to-be-unique big number instead
  generateName(name) {
    if (name.trim() === "") {
      const id = Math.floor((1e7 - 1) * Math.random()) + 1;
      return `AD Player #${"0".repeat(6 - Math.floor(Math.log10(id)))}${id}`;
    }
    if (name.length > 40) return `${name.slice(0, 37)}...`;
    return name;
  },
  // Hard-resets the current save and puts it in a state ready to be "unpaused" once resources start being generated
  prepareSave(name) {
    // Carry all relevant post-completion variables over too
    NG.restartWithCarryover();

    player.speedrun.isUnlocked = true;
    player.speedrun.isActive = true;
    this.modifySeed(SPEEDRUN_SEED_STATE.FIXED);
    player.speedrun.name = name;

    // We make a few assumptions on settings which are likely to be changed for all speedrunners
    for (const key of Object.keys(player.options.confirmations)) player.options.confirmations[key] = false;
    player.options.confirmations.glyphSelection = true;
    for (const key of Object.keys(player.options.animations)) {
      if (typeof player.options.animations[key] === "boolean") player.options.animations[key] = false;
    }

    // A few achievements are given for free to mitigate weird strategies at the beginning of runs or unavoidable
    // timewalls for particularly fast/optimized runs
    Achievement(22).unlock();
    Achievement(35).unlock();
    Achievement(61).unlock();
    Achievement(76).unlock();

    // Some time elapses after the reset and before the UI is actually ready, which ends up getting "counted" as offline
    player.speedrun.offlineTimeUsed = 0;
    GameStorage.save();
  },
  // Speedruns are initially paused until startTimer is called, which happens as soon as the player purchases a AD or
  // uses the Konami code. Until then, they're free to do whatever they want with the UI
  startTimer() {
    if (player.speedrun.hasStarted) return;
    player.speedrun.hasStarted = true;
    player.speedrun.startDate = Date.now();
    player.lastUpdate = Date.now();

    // This needs to be calculated "live" because using spentSTD includes any offline progress purchases too
    let currentSpent = 0;
    for (const purchase of ShopPurchase.all) {
      if (purchase.config.instantPurchase) continue;
      currentSpent += purchase.purchases * purchase.cost;
    }
    this.setSTDUse(ShopPurchaseData.isIAPEnabled && currentSpent > 0);
  },
  isPausedAtStart() {
    return player.speedrun.isActive && !player.speedrun.hasStarted;
  },
  // This needs to be here due to JS applying "function scope" to the player object within importing in storage.js,
  // which causes any direct changes done in storage.js to fall out of scope afterwards. We also don't want to change
  // this state at the beginning in case people want to share identical single-segment saves before starting the timer.
  setSegmented(state) {
    if (this.isPausedAtStart()) return;
    player.speedrun.isSegmented = state;
  },
  setSTDUse(state) {
    if (this.isPausedAtStart() || ShopPurchaseData.spentSTD === 0) return;
    player.speedrun.usedSTD = state;
  },
  mostRecentMilestone() {
    const newestTime = player.speedrun.records.max();
    if (newestTime === 0) return 0;
    return player.speedrun.records.indexOf(newestTime);
  },
  get pastRuns(){
    return JSON.parse(JSON.stringify(player.speedrun.previousRuns));
  },
  get modifiers(){
    return JSON.parse(JSON.stringify(player.speedrun.mods));
  },
  modifiersSet(value, key){
    if(value instanceof Decimal) {
      player.speedrun.mods[key] = new Decimal(value);
    }
    else{
      player.speedrun.mods[key] = value;
    }
  },
  get isRunning(){
    return player.speedrun.hasStarted;
  },
  get defaultModifiers() {
    return {
          ADMul: DC.D1,
          ADPow: 1,
          IDMul: DC.D1,
          IDPow: 1,
          TDMul: DC.D1,
          TDPow: 1,
          IPMul: DC.D1,
          IPPow: 1,
          EPMul: DC.D1,
          EPPow: 1,
          RMMul: DC.D1,
          RMPow: 1,
          InfMul: DC.D1,
          InfPow: 1,
          RepMul: DC.D1,
          RepPow: 1,
          EtrMul: DC.E3,
          EtrPow: 1,
          TPMul: DC.D1,
          TPPow: 1,
          DTMul: DC.D1,
          DTPow: 1,
          RealMul: 1,
          RealPow: 1,
          RealCapMul: DC.D1,
          RealCapPow: 1,
          IMCapMul: 1,
          IMCapPow: 1,
          chalAch: false,
          realTimeSpeed: 1,
          realTimeSpeedAutobuyers: true,
          gameSpeed: 1000000,
          gameSpeedAch: true,
          glyphsHaveFourEffects: false,
          effarigGlyphsHaveAllEffects: false,
          glyphsHaveMaxRarity: false,
          glyphRarity: 1,
          glyphLevel: 1,
          glyphAlcCap: 1,
          glyphAlcMul: 1,

          teresaSacMul: 1,
          effarigRelicMul: 1,
          namelessRealTimeMul: 1,
          vAchAreEasy: false,
          raMemoryMul: 1,
          raChunkMul: 1,
          laitelaDMDMul: 1,
          laitelaSingularityMul: 1,
          laitelaDEMul: 1,
          laitelaDMMul: 1,
          laitelaAnnilationMul: 1,
          pelleRemnantMul: 1,
          pelleRealityShardMul: 1,
        }
  },
  get modifierNames() {
    return {
      ADMul: 'AD Multiplier',
      ADPow: 'AD Power',
      IDMul: 'ID Multiplier',
      IDPow: 'ID Power',
      TDMul: 'TD Multiplier',
      TDPow: 'TD Power',
      IPMul: 'IP Multiplier',
      IPPow: 'IP Power',
      EPMul: 'EP Multiplier',
      EPPow: 'EP Power',
      RMMul: 'RM Multiplier',
      RMPow: 'RM Power',
      InfMul: 'Infinity Multiplier',
      InfPow: 'Infinity Power',
      RepMul: 'Replicanti Multiplier',
      RepPow: 'Replicanti Power',
      EtrMul: 'Eternity Multiplier',
      EtrPow: 'Eternity Power',
      TPMul: 'Tachyon Particle Multiplier',
      TPPow: 'Tachyon Particle Power',
      DTMul: 'Dilated Time Multiplier',
      DTPow: 'Dilated Time Power',
      RealMul: 'Reality Multiplier',
      RealPow: 'Reality Power',
      RealCapMul: 'RM Cap Multiplier',
      RealCapPow: 'RM Cap Power',
      IMCapMul: 'IM Cap Multiplier',
      IMCapPow: 'IM Cap Power',
      chalAch: 'Challenge Achievements',
      realTimeSpeed: 'Real Time Speed',
      realTimeSpeedAutobuyers: "Delta Time Autobuyers",
      gameSpeed: "Game Speed",
      gameSpeedAch: "Achievements Effect Game Speed",
      glyphsHaveFourEffects: 'Glyphs Always Have Four Effects',
      effarigGlyphsHaveAllEffects: 'Effarig Glyphs Can Have Up To Seven Effects',
      glyphsHaveMaxRarity: 'Glyphs Always Have Max Rarity',
      glyphRarity: 'Glyph Rarity Multiplier',
      glyphLevel: 'Glyph Level Multiplier',
      glyphAlcCap: 'Glpyh Alchemy Cap Multiplier',
      glyphAlcMul: 'Glpyh Alchemy Multiplier',

      teresaSacMul: 'Teresa Glyph Sacrafice Multiplier',
      effarigRelicMul: 'Relic Shard Mulitplier',
      namelessRealTimeMul: 'Stored Real Time Multiplier',
      vAchAreEasy: 'V Achievements Are Unlocked Instantly',
      raMemoryMul: 'Ra Memory Multiplier',
      raChunkMul: 'Ra Chunk Multiplier',
      laitelaDMDMul: 'DMD Multiplier',
      laitelaSingularityMul: 'Singularity Multiplier',
      laitelaDEMul: 'Dark Energy Multiplier',
      laitelaDMMul: 'Dark Matter Multiplier',
      laitelaAnnilationMul: 'Annilation Multiplier',
      pelleRemnantMul: 'Remanant Multiplier',
      pelleRealityShardMul: 'Reality Shard Multiplier',
    }
  }
};

class SpeedrunMilestone extends GameMechanicState {
  constructor(config) {
    super(config);
    this.registerEvents(config.checkEvent, args => this.tryComplete(args));
  }

  get name() {
    return this.config.name;
  }

  get isReached() {
    return player.speedrun.records[this.config.id] !== 0;
  }

  tryComplete(args) {
    if (!this.config.checkRequirement(args)) return;
    this.complete();
  }

  complete() {
    if (this.isReached || !player.speedrun.isActive) return;
    // Rounding slightly reduces filesize by removing weird float rounding
    player.speedrun.records[this.config.id] = Math.round(player.records.realTimePlayed);
    GameUI.notify.success(`Speedrun Milestone Reached: ${this.name}`);
  }
}

export const SpeedrunMilestones = SpeedrunMilestone.createAccessor(GameDatabase.speedrunMilestones);
