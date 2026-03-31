import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('cisp_area')
export class CispArea {
  @PrimaryColumn({ name: 'cisp_id', type: 'int' })
  cispId: number;

  @Column({ name: 'nome', type: 'varchar', nullable: true })
  nome: string;

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'MultiPolygon',
    srid: 4326,
  })
  geom: string;
}
