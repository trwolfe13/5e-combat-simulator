import { Creature, CreatureType } from '@sim/creature';
import * as _ from 'lodash';
import { DefaultDiceRoller } from './default-dice-roller.class';
import { DefaultEncounterStrategy } from './default-encounter-strategy.class';
import { DiceRoller } from './dice-roller.interface';
import { EncounterResult } from './encounter-result.interface';
import { EncounterStrategy } from './encounter-strategy.model';
import { TranscriptLogger } from './transcript-logger.class';

export class Encounter {
  public strategy: EncounterStrategy;
  public dice: DiceRoller;

  public creatures: Creature[] = [];
  public rounds = 0;
  public transcript: TranscriptLogger;

  constructor(strategy?: EncounterStrategy, dice?: DiceRoller) {
    this.transcript = new TranscriptLogger();
    this.strategy = strategy || new DefaultEncounterStrategy();
    this.dice = dice || new DefaultDiceRoller();
  }

  get survivors(): Creature[] {
    return this.creatures.filter(c => c.hp > 0);
  }

  get initiativeOrder(): Creature[] {
    return _.orderBy(this.creatures, c => c.initiative, 'desc');
  }

  run(): EncounterResult {
    this.rollInitiative();
    while (!this.winner()) { this.round(); }
    this.transcript.winner(this.winner());
    return {
      winner: this.winner(),
      rounds: this.rounds,
      survivors: this.survivors,
      transcript: this.transcript.getTranscript()
    };
  }

  private rollInitiative() {
    this.creatures.forEach(c => c.rollInitiative());
  }

  private round() {
    this.transcript.nextRound();
    this.initiativeOrder.forEach(c => {
      if (c.hp > 0) {
        c.turn(false);
        this.legendaryTurns(c);
      }
    });
    this.rounds++;
  }

  private winner(): CreatureType {
    if (this.survivors.every(c => c.type === 'player')) { return 'player'; }
    if (this.survivors.every(c => c.type === 'monster')) { return 'monster'; }
    return undefined;
  }

  private legendaryTurns(creature: Creature) {
    this.creatures
      .filter(c => c !== creature && c.hasLegendaryActions())
      .forEach(c => c.turn(true));
  }
}
