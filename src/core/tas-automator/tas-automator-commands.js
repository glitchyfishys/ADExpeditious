
const Red = { // what is ^ for? it for the start of the line
  Notify: /^Notify/ui,
  String: [
    /^".*"/,
    /^'.*'/,
  ],
  Number: /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/,
  Ping: /^Ping/ui,
  Infinity: /^Infinity/ui,
  Eternity: /^Eternity/ui,
  Reality: /^Reality/ui,
  NoWait: /^NoWait/ui,
  Space: /^[ \t]+/,
  Any: /.*/,
  Comment: /^\/\/|#/ui,
  Fish: /^🐟/ui,
  BrInfUG: /^BreakInfinityUpgrade/ui,
  IPMult: /^IPMult/ui,
  InfUG: /^InfinityUpgrade/ui,
  RepUG: /^ReplicantiUpgrade/ui,
  UnlockReplicanti: /^UnlockReplicanti/ui,
  UGAuto: /^UpgradeAutobuyer/ui,
  AD: /^AntimatterDimension/ui,
  ID: /^InfinityDimension/ui,
  TD: /^TimeDimension/ui,
  Unlock: /^Unlock/ui,
  BreakInfinity: /^BreakInfinity/ui,
  Tickspeed: /^Tickspeed/ui,
  AntimatterGalaxy: /^AntimatterGalaxy/ui,
  DimensionBoost: /^DimensionBoost/ui,
  ReplicantiGalaxy: /^ReplicantiGalaxy/ui,
  NC: /^NC(1[0-2]|[1-9])/ui,
  IC: /^IC([1-8])/ui,
  EC: /^EC(1[0-2]|[1-9])/ui,
  StartChallenge: /^StartChallenge/ui,
  TimeOut: /^TimeOut/ui,
}

class TASAutomatorCommand {
  constructor(commandInfo) {
    this.rule = commandInfo.rule;
    this.string = commandInfo.string;
    this.command = commandInfo.command;
    this.validation = commandInfo.validate;
    this.id = commandInfo.id;
    this.key = commandInfo.key;
  }

  validate(inlineInfo){
    this.validation(inlineInfo);
  }

  run(commandLine, line) {
    let inline = this.inline(commandLine);
    let key = [];
    inline.forEach(k => {
      key.push(k);
    })
    return this.command(key, line);
  }

  inline(commandLine) {
    let inline = [];
    this.rule.forEach(r => {
      commandLine = commandLine.replace(Red.Space, "");
      if (Array.isArray(r)) {
        r.some(v => {
          commandLine = commandLine.replace(Red.Space, "");
          if (v.test(commandLine)) {
            inline.push(v.exec(commandLine)[0]);
            commandLine = commandLine.replace(v, "");
            return true;
          }
        });
      }
      else if (r instanceof RegExp && r.test(commandLine)) {
        inline.push(r.exec(commandLine)[0]);
        commandLine = commandLine.replace(r, "");
      }
      else if (typeof r == 'object') {
        if (r.optional && r.optional.test(commandLine)) {
          inline.push(r.optional.exec(commandLine)[0]);
          commandLine = commandLine.replace(r.optional, "");
        }
      }
      
    });
    return inline;
  }

  checkRule(commandLine) {
    let c = 0;
    this.rule.forEach(r => {
      commandLine = commandLine.replace(Red.Space, "");
      if (Array.isArray(r)) {
        let cc = 0;
        r.forEach(v => {
          commandLine = commandLine.replace(Red.Space, "");
          if (v.test(commandLine)) {
            commandLine = commandLine.replace(v, "");
            cc++;
          }
        })
        if (cc > 0) c++;
      }
      else if (r instanceof RegExp) {
        if (r.test(commandLine)) {
          commandLine = commandLine.replace(r, "");
          c++;
        }
      }
      else if (typeof r == 'object') {
        if (r.optional) {
          commandLine = commandLine.replace(r.optional, "");
          c++;
        }
      }
      
    });
    
    return c == this.rule.length;
  }

  nextString(commandLine) {
    let c = -1;
    commandLine = commandLine.toLowerCase();
    let PervCommand = "";
    let Optionals = [];
    this.string.some(r => {
      commandLine = commandLine.replace(Red.Space, "");

      if (commandLine == "") return true;

      if (Array.isArray(r)) {
        let cc = 0;
        r.forEach(v => {

          if ((v == 'number' || v == 'amount') && Red.Number.test(commandLine)) {
            cc++;
            commandLine = commandLine.replace(Red.Number, "");
          }

          if (commandLine.startsWith(v)) {
            commandLine = commandLine.replace(v, "");
            cc++;
          }

        });

        if (cc > 0) {
          PervCommand = r[0];
          c++;
          return false;
        }
        else return true;
      }
      else if (typeof r == 'string') {

        if ((r == 'number' || r == 'amount') && Red.Number.test(commandLine)) {
          c++;
          PervCommand = r;
          commandLine = commandLine.replace(Red.Number, "");
          return false;
        }
          
        if (r.startsWith(commandLine)) {
          c++;
          return true;
        }
        else if (commandLine.startsWith(r)) {
          
          PervCommand = r;
          commandLine = commandLine.replace(r, "");
          c++;
          return false;
        }
      }
      else if (typeof r == 'object') {
        if (r.optional) {
          c++;
          if (commandLine.startsWith(r.optional)) {
            PervCommand = r;
            commandLine = commandLine.replace(r.optional, "");
          }
          else Optionals.push({string: r.optional, slot: c});
          return false;
        }
      }
      return true;
    });
    
    if (this.string[c]?.optional && this.string[c] != this.string.last()) c++;
    if (this.string[c] && this.string[c] == PervCommand) c++;
    
    if (this.string[c]?.optional && this.string[c] == this.string.last()) return {string: Optionals.map(x => ((c - Optionals.length) < x.slot) ? x.string : null).compact(), end: true};
    
    if (c == this.string.length) return {string: null, end: true};
    if (c == -1) return {string: null, end: false};
    const list = [];
    list.push(this.string[c]);
    list.push(Optionals.map(x => (c > x.slot) ? x.string : null).compact());
    return {string: list, end: c > 0};
  }
}

function NoWait(Str){
  return Red.NoWait.test(Str) ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION :
  AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;
}

// command priority is important.
// keep the strings in lowercase, i dont want to use .toLowerCase()
export const TASAutomatorCommands = [
  new TASAutomatorCommand (
    {
      id: "comment",
      key: Red.Comment,
      rule: [
        Red.Comment,
        Red.Any,
      ],
      string: [
        "//",
        "any thing",
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: ctx => {
        return AUTOMATOR_COMMAND_STATUS.NEXT_INSTRUCTION;
      },
    }),
  new TASAutomatorCommand (
    {
      id: "notifty",
      key: Red.Notify,
      rule: [
        Red.Notify,
        Red.String,
      ],
      string: [
        "notify",
        ["'text'", '"text"'],
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: ctx => {
        GameUI.notify.automator(ctx[1].replaceAll("'", "").replaceAll('"', ""), 4000);
        return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
      },
    }),
  new TASAutomatorCommand (
    {
      id: "BuyBreakInfinityUpgrade",
      key: Red.BrInfUG,
      rule: [
        Red.BrInfUG,
        {optional: Red.NoWait},
        Red.Number,
        {optional: Red.Ping},
      ],
      string: [
        "breakinfinityupgrade",
        {optional: "nowait"},
        "number",
        {optional: "ping"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: (ctx, line) => {
        let id = Number.parseInt(ctx[1]);
        if (isNaN(id)) id = Number.parseInt(ctx[2]);

        let ping = Red.Ping.test(ctx[2]) || ctx[3];
        if (id < 1 || id > 12) {
          TASAutomatorData.logCommandEvent("Invalid Break Infinity Upgrade", line);
          return AUTOMATOR_COMMAND_STATUS.NEXT_INSTRUCTION
        }

        const Bought = BreakInfinityUpgrade.all[id -1].purchase();
        if (Bought) {
          if (ping) GameUI.notify.automator(`Bought Break Infinity Upgrade ${id}`, 4000);
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }

        return Red.NoWait.test(ctx[1]) ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;
      },
    }),
  new TASAutomatorCommand (
    {
      id: "BuyInfinityUpgrade",
      key: Red.InfUG,
      rule: [
        Red.InfUG,
        {optional: Red.NoWait},
        Red.Number,
        {optional: Red.Ping},
      ],
      string: [
        "infinityupgrade",
        {optional: "nowait"},
        "number",
        {optional: "ping"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: (ctx, line) => {
        let id = Number.parseInt(ctx[1]);
        if (isNaN(id)) id = Number.parseInt(ctx[2]);

        let ping = Red.Ping.test(ctx[2]) || ctx[3];
        if (id < 1 || id > 20) {
          TASAutomatorData.logCommandEvent("Invalid Infinity Upgrade", line);
          return AUTOMATOR_COMMAND_STATUS.NEXT_INSTRUCTION
        }

        const Bought = InfinityUpgrade.all[id -1].purchase();
        if (Bought) {
          if (ping) GameUI.notify.automator(`Bought Infinity Upgrade ${id}`, 4000);
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }

        return Red.NoWait.test(ctx[1]) ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;
      },
    }),
  new TASAutomatorCommand (
    {
      id: "BuyReplicantiUpgrade",
      key: Red.RepUG,
      rule: [
        Red.RepUG,
        {optional: Red.NoWait},
        Red.Number,
        {optional: Red.Ping},
      ],
      string: [
        "replicantiupgrade",
        {optional: "nowait"},
        "number",
        {optional: "ping"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: (ctx, line) => {
        let id = Number.parseInt(ctx[1]);
        if (isNaN(id)) id = Number.parseInt(ctx[2]);

        let ping = Red.Ping.test(ctx[2]) || ctx[3];
        if (id < 1 || id > 3) {
          TASAutomatorData.logCommandEvent("Invalid Replicanti Upgrade", line);
          return AUTOMATOR_COMMAND_STATUS.NEXT_INSTRUCTION
        }

        let Bought = false;
        if (id == 1) Bought = ReplicantiUpgrade.chance.purchase();
        else if (id == 2) Bought = ReplicantiUpgrade.interval.purchase();
        else if (id == 3) Bought = ReplicantiUpgrade.galaxies.purchase();

        if (Bought) {
          if (ping) GameUI.notify.automator(`Bought Replicanti Upgrade ${id}`, 4000);
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }

        return Red.NoWait.test(ctx[1]) ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;
      },
    }),
  new TASAutomatorCommand (
    {
      id: "UnlockReplicanti",
      key: Red.UnlockReplicanti,
      rule: [
        Red.UnlockReplicanti,
        {optional: Red.NoWait},
        {optional: Red.Ping},
      ],
      string: [
        "unlockreplicanti",
        {optional: "nowait"},
        {optional: "ping"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: (ctx, line) => {
        if (Replicanti.unlock(false)) {
          if (Red.Ping.test(ctx[2])) GameUI.notify.automator(`Unlocked Replicanti`, 4000);
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }

        return Red.NoWait.test(ctx[1]) ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;
      },
    }),
  new TASAutomatorCommand (
    {
      id: "IPMult",
      key: Red.IPMult,
      rule: [
        Red.IPMult,
        {optional: Red.NoWait},
        Red.Number,
        {optional: Red.Ping},
      ],
      string: [
        "ipmult",
        {optional: "nowait"},
        "amount",
        {optional: "ping"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: (ctx, line) => {
        let count = Number.parseInt(ctx[1]);
        if (isNaN(count)) count = Number.parseInt(ctx[2]);

        if (count < 0) {
          TASAutomatorData.logCommandEvent("Invalid Can not buy less than 0 IP Multiplier upgrades", line);
          return AUTOMATOR_COMMAND_STATUS.NEXT_INSTRUCTION
        }
        let ping = Red.Ping.test(ctx[2]) || ctx[3];

        const ug = InfinityUpgrade.all[17];
        if (!ug.hasIncreasedCost) {
          // Only allow IP below the softcap to be used
          const availableIP = Currency.infinityPoints.value.clampMax(ug.config.costIncreaseThreshold);
          const purchases = Decimal.affordGeometricSeries(availableIP, ug.cost, ug.costIncrease, 0).toNumber();
          count = Math.min(purchases);
        }
        if (ug.hasIncreasedCost) {
          const availableIP = Currency.infinityPoints.value.clampMax(ug.config.costCap);
          const purchases = Decimal.affordGeometricSeries(availableIP, ug.cost, ug.costIncrease, 0).toNumber();
          count = Math.min(purchases);
        }
        
        const amo = player.IPMultPurchases;
        ug.purchase(count);
        if (amo < player.IPMultPurchases) {
          if (ping) GameUI.notify.automator(`Bought IP Multiplier ${player.IPMultPurchases - amo} times`, 4000);
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }

        return Red.NoWait.test(ctx[1]) ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;
      },
    }),
  new TASAutomatorCommand (
    {
      id: "UpgradeAuto",
      key: Red.UGAuto,
      rule: [
        Red.UGAuto,
        {optional: Red.NoWait},
        Red.Number,
        {optional: Red.Ping},
      ],
      string: [
        "upgradeautobuyer",
        {optional: "nowait"},
        "number",
        {optional: "ping"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: (ctx, line) => {
        let id = Number.parseInt(ctx[1]);
        if (isNaN(id)) id = Number.parseInt(ctx[2]);

        if (id < 0 || id > 12) {
          TASAutomatorData.logCommandEvent("Invalid Autobuyer", line);
          return AUTOMATOR_COMMAND_STATUS.NEXT_INSTRUCTION
        }
        let ping = Red.Ping.test(ctx[2]) || ctx[3];

        let didThing = false;
        if (id == 12) didThing = Autobuyer.bigCrunch.upgradeInterval(false);
        else if (id == 11) didThing = Autobuyer.galaxy.upgradeInterval(false);
        else if (id == 10) didThing = Autobuyer.dimboost.upgradeInterval(false);
        else if (id == 9) {
          const a = Autobuyer.tickspeed.upgradeInterval(false);
          const b = Autobuyer.tickspeed.purchase();
          didThing = a || b;
        }
        else {
          const a = Autobuyer.antimatterDimension(id).upgradeBulk();
          const b = Autobuyer.antimatterDimension(id).upgradeInterval(false);
          const c = Autobuyer.antimatterDimension(id).purchase();
          didThing = a || b || c;
        }

        if (didThing) {
          if (ping) {
            if (id == 12) GameUI.notify.automator(`Upgraded Big Crunch Autobuyer`, 4000);
            else if (id == 11) GameUI.notify.automator(`Upgraded Antimatter Galaxy Autobuyer`, 4000);
            else if (id == 10) GameUI.notify.automator(`Upgraded Dimension Boost Autobuyer`, 4000);
            else GameUI.notify.automator(`Bought, Upgraded, or unlocked ${id == 9 ? "Tickspeed" : "Antimatter Dimension"} Autobuyer`, 4000);
          }
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }

        return Red.NoWait.test(ctx[1]) ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;
      },
    }),
  new TASAutomatorCommand (
    {
      id: "StartChallenge",
      key: Red.StartChallenge,
      rule: [
        Red.StartChallenge,
        {optional: Red.NoWait},
        [Red.NC, Red.IC, Red.EC],
        {optional: Red.Ping},
      ],
      string: [
        "startchallenge",
        {optional: "nowait"},
        ['nc2', 'nc3', 'ic1', 'ic2', 'ec1', 'ec2'],
        {optional: "ping"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: ctx => {
        let Challenge = ctx[1];
        if (Red.NoWait.test(Challenge)) Challenge = ctx[2];
        let ping = ctx[2] == 'ping' | ctx[3];

        if (Challenge.startsWith('nc')) {
          const ChalID = Number.parseInt(Challenge.replace('nc', ''));
          if (isNaN(ChalID)) return NoWait(ctx[1]);
          if (ChalID < 1 || ChalID > 12) {
            TASAutomatorData.logCommandEvent("Invalid Normal Challenge", line);
            return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
          }
          if(!NormalChallenge(ChalID).start()) NoWait(ctx[1]);
          if(ping) GameUI.notify.automator(`Started NC${ChalID}`, 4000);
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }
        else if (Challenge.startsWith('ic')) {
          const ChalID = Number.parseInt(Challenge.replace('ic', ''));
          if (isNaN(ChalID)) return NoWait(ctx[1]);
          if (ChalID < 1 || ChalID > 8) {
            TASAutomatorData.logCommandEvent("Invalid Infinity Challenge", line);
            return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
          }
          if(!InfinityChallenge(ChalID).start()) NoWait(ctx[1]);
          if(ping) GameUI.notify.automator(`Started IC${ChalID}`, 4000);
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }
        else if (Challenge.startsWith('ec')) {
          const ChalID = Number.parseInt(Challenge.replace('ec', ''));
          if (isNaN(ChalID)) return NoWait(ctx[1]);
          if (ChalID < 1 || ChalID > 12) {
            TASAutomatorData.logCommandEvent("Invalid Eternity Challenge", line);
            return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
          }
          if(!EternityChallenge(ChalID).start(true)) NoWait(ctx[1]);
          if(ping) GameUI.notify.automator(`Started EC${ChalID}`, 4000);
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }
        
        TASAutomatorData.logCommandEvent("Invalid Challenge", line);

        return NoWait(ctx[1]);
      },
    }),
  new TASAutomatorCommand (
    {
      id: "AD",
      key: Red.AD,
      rule: [
        Red.AD,
        {optional: Red.NoWait},
        Red.Number,
        Red.Number,
        {optional: Red.Ping},
      ],
      string: [
        "antimatterdimension",
        {optional: "nowait"},
        "number",
        "amount",
        {optional: "ping"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: (ctx, line) => {
        let id = Number.parseInt(ctx[1]);
        if (isNaN(id)) id = Number.parseInt(ctx[2]);

        
        if (id < 0 || id > 8) {
          TASAutomatorData.logCommandEvent("Invalid Antimatter Dimension", line);
          return AUTOMATOR_COMMAND_STATUS.NEXT_INSTRUCTION
        }
        let count = Number.parseInt(ctx[2]);
        if (isNaN(count) || count === id) count = Number.parseInt(ctx[3]);
        
        let didThing = false
        if (count < 11) {
          for (let i=0; i < count; i++) {
            didThing = buyOneDimension(id) || didThing;
          }
        }
        else if (count > 1000) didThing = buyMaxDimension(id);
        else didThing = buyMaxDimension(id, count / 10);
        
        let ping = Red.Ping.test(ctx[3]) || ctx[4];
        if (didThing) {
          if (ping) {
            GameUI.notify.automator(`Bought ${AntimatterDimension(id).shortDisplayName} Antimatter Dimensions`, 4000);
          }
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }

        return Red.NoWait.test(ctx[1]) ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;
      },
    }),
  new TASAutomatorCommand (
    {
      id: "ID",
      key: Red.ID,
      rule: [
        Red.ID,
        {optional: Red.NoWait},
        Red.Number,
        [Red.Number, Red.Unlock],
        {optional: Red.Ping},
      ],
      string: [
        "infinitydimension",
        {optional: "nowait"},
        "number",
        ["amount", "unlock"],
        {optional: "ping"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: (ctx, line) => {
        let id = Number.parseInt(ctx[1]);
        if (isNaN(id)) id = Number.parseInt(ctx[2]);

        
        if (id < 0 || id > 8) {
          TASAutomatorData.logCommandEvent("Invalid Infinity Dimension", line);
          return AUTOMATOR_COMMAND_STATUS.NEXT_INSTRUCTION
        }

        if (Red.Unlock.test(ctx[2]) || Red.Unlock.test(ctx[3])) {
          const W = InfinityDimension(id).unlock();
          if (W && (Red.Ping.test(ctx[3]) || ctx[4])) GameUI.notify.automator(`Unlocked ${InfinityDimension(id).shortDisplayName} Infinity Dimensions`, 4000);
          return (W || Red.NoWait.test(ctx[1])) ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;
        }

        let count = Number.parseInt(ctx[2]);
        if (isNaN(count) || count === id) count = Number.parseInt(ctx[3]);
        
        let didThing = false
        if (count < 11) {
          for (let i=0; i < count; i++) {
            didThing = InfinityDimension(id).buySingle(true) || didThing;
          }
        }
        else didThing = InfinityDimension(id).buyMax(true);
        
        let ping = Red.Ping.test(ctx[3]) || ctx[4];
        if (didThing) {
          if (ping) {
            GameUI.notify.automator(`Bought ${InfinityDimension(id).shortDisplayName} Infinity Dimensions`, 4000);
          }
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }

        return Red.NoWait.test(ctx[1]) ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;
      },
    }),
  new TASAutomatorCommand (
    {
      id: "TD",
      key: Red.TD,
      rule: [
        Red.TD,
        {optional: Red.NoWait},
        Red.Number,
        [Red.Number, Red.Unlock],
        {optional: Red.Ping},
      ],
      string: [
        "timedimension",
        {optional: "nowait"},
        "number",
        ["amount", "unlock"],
        {optional: "ping"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: (ctx, line) => {
        let id = Number.parseInt(ctx[1]);
        if (isNaN(id)) id = Number.parseInt(ctx[2]);

        
        if (id < 0 || id > 8) {
          TASAutomatorData.logCommandEvent("Invalid Time Dimension", line);
          return AUTOMATOR_COMMAND_STATUS.NEXT_INSTRUCTION
        }

        let count = Number.parseInt(ctx[2]);
        if (isNaN(count) || count === id) count = Number.parseInt(ctx[3]);
        
        if (Red.Unlock.test(ctx[2]) || Red.Unlock.test(ctx[3])) {
          if (id < 5) {
            TASAutomatorData.logCommandEvent(`Can not unlock ${TimeDimension(id).shortDisplayName} Time Dimension`, line);
            return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
          }
          if (TimeDimension(id).tryUnlock()) {
            if (Red.Ping.test(ctx[3]) || ctx[4]) GameUI.notify.automator(`Unlocked ${TimeDimension(id).shortDisplayName} Time Dimension`, 4000);
          }
          return NoWait(ctx[1]);
        }
        let didThing = false
        if (count < 11) {
          for (let i=0; i < count; i++) {
            didThing = buySingleTimeDimension(id, true) || didThing;
          }
        }
        else didThing = buyMaxTimeDimension(id, 1, true, true);
        
        let ping = Red.Ping.test(ctx[3]) || ctx[4];
        if (didThing) {
          if (ping) {
            GameUI.notify.automator(`Bought ${TimeDimension(id).shortDisplayName} Time Dimensions`, 4000);
          }
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }

        return NoWait(ctx[1]);
      },
    }),
  new TASAutomatorCommand (
    {
      id: "Tickspeeed",
      key: Red.Tickspeed,
      rule: [
        Red.Tickspeed,
        {optional: Red.NoWait},
        Red.Number,
        {optional: Red.Ping},
      ],
      string: [
        "tickspeed",
        {optional: "nowait"},
        "amount",
        {optional: "ping"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: (ctx) => {

        let amount = Number.parseInt(ctx[1]);
        if (isNaN(amount)) amount = Number.parseInt(ctx[2]);
        
        let total = player.totalTickBought;
        let didThing = false
        if (amount < 26) {
          for (let i=0; i < amount; i++) {
            didThing = buyTickSpeed() || didThing;
          }
        }
        else didThing = buyMaxTickSpeed();
        
        if (didThing) {
          if (Red.Ping.test(ctx[2]) || ctx[3]) {
            GameUI.notify.automator(`Bought ${format(player.totalTickBought - total)} Tickspeed upgrades`, 4000);
          }
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }

        return Red.NoWait.test(ctx[1]) ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;
      },
    }),
  new TASAutomatorCommand (
    {
      id: "breakInfinity",
      key: Red.BreakInfinity,
      rule: [
        Red.BreakInfinity,
        {optional: Red.NoWait},
        {optional: Red.Ping},
      ],
      string: [
        "breakinfinity",
        {optional: "nowait"},
        {optional: "ping"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: ctx => {
        if(breakInfinity()) {
          if (Red.Ping.test(ctx[1]) || ctx[2]) GameUI.notify.automator("Infinity has been broken", 4000);
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }
        return ctx[1] ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;

      },
    }),
  new TASAutomatorCommand (
    {
      id: "dimboost",
      key: Red.DimensionBoost,
      rule: [
        Red.DimensionBoost,
        {optional: Red.NoWait},
        {optional: Red.Ping},
      ],
      string: [
        "dimensionboost",
        {optional: "nowait"},
        {optional: "ping"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: ctx => {
        if(requestDimensionBoost(true)) {
          if (Red.Ping.test(ctx[1]) || ctx[2]) GameUI.notify.automator("Preformed Dimension Boost Reset", 4000);
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }
        return ctx[1] ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;

      },
    }),
  new TASAutomatorCommand (
    {
      id: "AntimatterGalaxy",
      key: Red.AntimatterGalaxy,
      rule: [
        Red.AntimatterGalaxy,
        {optional: Red.NoWait},
        {optional: Red.Ping},
      ],
      string: [
        "antimattergalaxy",
        {optional: "nowait"},
        {optional: "ping"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: ctx => {
        if(requestGalaxyReset()) {
          if (Red.Ping.test(ctx[1]) || ctx[2]) GameUI.notify.automator("Preformed Antimatter Galaxy Reset", 4000);
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }
        return ctx[1] ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;

      },
    }),
  new TASAutomatorCommand (
    {
      id: "replicantiGalaxy",
      key: Red.ReplicantiGalaxy,
      rule: [
        Red.ReplicantiGalaxy,
        {optional: Red.NoWait},
        {optional: Red.Ping},
      ],
      string: [
        "replicantigalaxy",
        {optional: "nowait"},
        {optional: "ping"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: ctx => {
        if(replicantiGalaxy(true)) {
          if (Red.Ping.test(ctx[1]) || ctx[2]) GameUI.notify.automator("Preformed Replicanti Galaxy Reset", 4000);
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }
        return ctx[1] ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;

      },
    }),
  new TASAutomatorCommand (
    {
      id: "infinity",
      key: Red.Infinity,
      rule: [
        Red.Infinity,
        {optional: Red.NoWait}
      ],
      string: [
        "infinity",
        {optional: "nowait"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: ctx => {
        if(Player.canCrunch) {
          GameUI.notify.automator("Preformed Big Crunch", 4000);
          bigCrunchReset();
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }
        return ctx[1] ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;

      },
    }),
  new TASAutomatorCommand (
    {
      id: "eternity",
      key: Red.Eternity,
      rule: [
        Red.Eternity,
        {optional: Red.NoWait}
      ],
      string: [
        "eternity",
        {optional: "nowait"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: ctx => {
        if(Player.canEternity) {
          GameUI.notify.automator("Preformed Eternity", 4000);
          eternity();
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }
        return ctx[1] ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;

      },
    }),
  new TASAutomatorCommand (
    {
      id: "reality",
      key: Red.Reality,
      rule: [
        Red.Reality,
        {optional: Red.NoWait}
      ],
      string: [
        "reality",
        {optional: "nowait"},
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: ctx => {
        if(isRealityAvailable()) {
          GameUI.notify.automator("Preformed Reality", 4000);
          autoReality();
          return AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION;
        }
        return ctx[1] ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;

      },
    }),
  new TASAutomatorCommand (
    {
      id: "🐟",
      key: Red.Fish,
      rule: [
        Red.Fish,
      ],
      string: [
        "🐟",
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: ctx => {
        GameUI.notify.automator("Why?", 4000);
        GlobalErrorHandler.stopGame();
        GlobalErrorHandler.crash("Why?")
        return ctx[1] ? AUTOMATOR_COMMAND_STATUS.NEXT_TICK_NEXT_INSTRUCTION : AUTOMATOR_COMMAND_STATUS.NEXT_TICK_SAME_INSTRUCTION;
      },
    }),
  new TASAutomatorCommand (
    {
      id: "TimeOut",
      key: Red.TimeOut,
      rule: [
        Red.TimeOut,
        Red.Number,
      ],
      string: [
        "timeout",
        "number",
      ],
      validate: (ctx) => {
        
        return true;
      },
      command: ctx => {
        TASAutomatorBackend.timeOut = Number.parseInt(ctx[1]);
        return AUTOMATOR_COMMAND_STATUS.TIME_OUT;
      },
    }),
];

const commentRule = { regex: /(\/\/|#).*/u, token: "comment", next: "start" };

// this only colours the code

CodeMirror.defineSimpleMode("TAS", {
  // The start state contains the rules that are intially used
  start: [
    commentRule,
    { regex: /studies\s+/ui, token: "keyword", next: "studiesArgs" },
    { regex: /blob\s\s/ui, token: "blob" },
    { regex: /StartChallenge|AntimatterGalaxy|ReplicantiGalaxy|Galaxy|DimensionBoost/ui, token: "keyword", next: "commandArgs" },
    { regex: /AntimatterDimension|InfinityDimension|TimeDimension/ui, token: "keyword", next: "commandArgs" },
    { regex: /Tickspeed|UnlockReplicanti|ReplicantiUpgrade|UpgradeAutobuyer|IPmult|BreakInfinityUpgrade|InfinityUpgrade|BreakInfinity/ui, token: "keyword", next: "commandArgs" },
    {
      // eslint-disable-next-line max-len
      regex: /(TimeOut|auto|if|pause|studies|time[ \t]+theorems?|space[ \t]+theorems?|until|wait|while|black[ \t]+hole|stored?[ \t]+game[ \t]+time|notify)\s/ui,
      token: "keyword",
      next: "commandArgs"
    },
    {
      regex: /stop/ui,
      token: "keyword",
      next: "commandDone"
    },
    {
      regex: /start\s|unlock\s/ui,
      token: "keyword",
      next: "startUnlock"
    },
    { regex: /infinity\S+|eternity\S+|reality\S+|pause\S+|restart\S+/ui, token: "error", next: "commandDone" },
    { regex: /infinity|eternity|reality/ui, token: "keyword", next: "prestige" },
    { regex: /pause|restart/ui, token: "keyword", next: "commandDone" },
    { regex: /\}/ui, dedent: true },
    { regex: /\S+\s/ui, token: "error", next: "commandDone" },
  ],
  studiesArgs: [
    commentRule,
    { sol: true, next: "start" },
    { regex: /load(\s+|$)/ui, token: "variable-2", next: "studiesLoad" },
    { regex: /respec/ui, token: "variable-2", next: "commandDone" },
    { regex: /purchase/ui, token: "variable-2", next: "studiesList" },
    { regex: /nowait(\s+|$)/ui, token: "property" },
  ],
  studiesList: [
    commentRule,
    { sol: true, next: "start" },
    { regex: /(antimatter|infinity|time)(?=[\s,|]|$)/ui, token: "number" },
    { regex: /(active|passive|idle)(?=[\s,|]|$)/ui, token: "number" },
    { regex: /(light|dark)(?=[\s,|]|$)/ui, token: "number" },
    { regex: /([1-9][0-9]+)(?=[\s,!|-]|$)/ui, token: "number" },
    { regex: /[a-zA-Z_][a-zA-Z_0-9]*/u, token: "variable", next: "commandDone" },
    { regex: /!$/ui, token: "variable-2" },
    { regex: /([1-9]|1[0-2])(?=!|$)/ui, token: "number" },
  ],
  studiesLoad: [
    commentRule,
    { sol: true, next: "start" },
    { regex: /id(\s+|$)/ui, token: "variable-2", next: "studiesLoadId" },
    { regex: /name(\s+|$)/ui, token: "variable-2", next: "studiesLoadPreset" },
    { regex: /\S+/ui, token: "error" },
  ],
  studiesLoadId: [
    commentRule,
    { sol: true, next: "start" },
    { regex: /\d/ui, token: "qualifier", next: "commandDone" },
  ],
  studiesLoadPreset: [
    commentRule,
    { sol: true, next: "start" },
    { regex: /(\/(?!\/)|[^\s#/])+/ui, token: "qualifier", next: "commandDone" },
  ],
  prestige: [
    commentRule,
    { sol: true, next: "start" },
    { regex: /nowait(\s|$)/ui, token: "property" },
    { regex: /respec/ui, token: "variable-2" },
  ],
  commandDone: [
    commentRule,
    { sol: true, next: "start" },
    // This seems necessary to have a closing curly brace de-indent automatically in some cases
    { regex: /\}/ui, dedent: true },
    { regex: /\S+/ui, token: "error" },
  ],
  startUnlock: [
    commentRule,
    { sol: true, next: "start" },
    {
      regex: /ec(1[0-2]|[1-9])|dilation|ic(1[0-2]|[1-9])|nc(1[0-2]|[1-9])/ui,
      token: "variable-2",
      next: "commandDone",
    },
    { regex: /nowait(\s|$)/ui, token: "property" },
  ],
  commandArgs: [
    commentRule,
    { sol: true, next: "start" },
    { regex: /<=|>=|<|>/ui, token: "operator" },
    { regex: /nowait(\s|$)/ui, token: "property" },
    { regex: /".*"/ui, token: "string", next: "commandDone" },
    { regex: /'.*'/ui, token: "string", next: "commandDone" },
    { regex: /(on|off|bh1|bh2|dilation|load|respec)(\s|$)/ui, token: "variable-2" },
    { regex: /(eternity|reality|use)(\s|$)/ui, token: "variable-2" },
    { regex: /(antimatter|infinity|time)(\s|$|(?=,))/ui, token: "variable-2" },
    { regex: /(active|passive|idle)(\s|$|(?=,))/ui, token: "variable-2" },
    { regex: /(light|dark)(\s|$|(?=,))/ui, token: "variable-2" },
    { regex: /x[\t ]+highest(\s|$)/ui, token: "variable-2" },
    { regex: /pending[\t ]+(completions|ip|ep|tp|rm|glyph[\t ]+level)(\s|$)/ui, token: "variable-2" },
    { regex: /total[\t ]+(completions|tt|space theorems)(\s|$)/ui, token: "variable-2" },
    { regex: /filter[ \t]+score/ui, token: "variable-2" },
    { regex: /ec(1[0-2]|[1-9])[\t ]+completions(\s|$)/ui, token: "variable-2" },
    { regex: /(am|ip|ep|all)(\s|$)/ui, token: "variable-2" },
    {
      regex: /(rm|rg|dt|tp|tt|space theorems|(banked )?infinities|eternities|realities|rep(licanti)?)(\s|$)/ui,
      token: "variable-2",
    },
    { regex: / sec(onds ?) ?| min(utes ?) ?| hours ?/ui, token: "variable-2" },
    { regex: /([0-9]+:[0-5][0-9]:[0-5][0-9]|[0-5]?[0-9]:[0-5][0-9]|t[1-4])/ui, token: "number" },
    { regex: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/ui, token: "number" },
    { regex: /[a-zA-Z_][a-zA-Z_0-9]*/u, token: "variable" },
    { regex: /\{/ui, indent: true, next: "commandDone" },
    // This seems necessary to have a closing curly brace de-indent automatically in some cases
    { regex: /\}/ui, dedent: true },
  ],

  // The meta property contains global information about the mode. It
  // can contain properties like lineComment, which are supported by
  // all modes, and also directives like dontIndentStates, which are
  // specific to simple modes.
  meta: {
    lineComment: "//",
    electricChars: "}",
  }
});