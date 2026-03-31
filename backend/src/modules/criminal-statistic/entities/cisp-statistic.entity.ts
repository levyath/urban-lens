import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('cisp_statistic')
export class CispStatistic {
  @PrimaryColumn({ name: 'cisp', type: 'int' })
  cisp: number;

  // PESO 3 (Risco à Vida)
  @Column({ name: 'letalidade_violenta', type: 'int', default: 0 })
  letalidadeViolenta: number;

  // PESO 2 (Risco de Rua e Ameaça)
  @Column({ name: 'roubo_rua', type: 'int', default: 0 })
  rouboRua: number;

  @Column({ name: 'roubo_veiculo', type: 'int', default: 0 })
  rouboVeiculo: number;

  // PESO 1 (Risco ao Patrimônio)
  @Column({ name: 'total_furtos', type: 'int', default: 0 })
  totalFurtos: number;

  // ÍNDICE CALCULADO
  // Guarda o valor final da fórmula: (Letalidade * 3) + (Roubos * 2) + (Furtos * 1)
  @Column({ name: 'pontuacao_risco', type: 'int', default: 0 })
  pontuacaoRisco: number;
}
