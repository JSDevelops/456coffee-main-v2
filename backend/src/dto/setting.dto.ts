import { IsObject } from 'class-validator';

export class UpdateSettingsDto {
  /**
   * Free-form key→value map. Each entry is upserted into the Setting table.
   * Example: { "font.family": "Sarabun" }
   */
  @IsObject()
  settings!: Record<string, string>;
}
