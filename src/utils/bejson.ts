export interface CharacterData {
  id: string;
  name: string;
  level: number;
  maxHp: number;
  currentHp: number;
  ac: number;
  stats: {
    Strength: number;
    Dexterity: number;
    Constitution: number;
    Intelligence: number;
    Wisdom: number;
    Charisma: number;
  };
  coins: number;
  staff: number;
  vodkas: { proof: number; quantity: number }[];
}

export function exportCharacterToBEJSON(char: CharacterData): string {
  const bejson = {
    "Format": "BEJSON",
    "Format_Version": "104db",
    "Format_Creator": "Elton Boehnen",
    "Records_Type": [
      "Character",
      "AbilityScore",
      "Inventory"
    ],
    "Fields": [
      { "name": "Record_Type_Parent", "type": "string" },
      { "name": "character_id", "type": "string" },
      { "name": "name", "type": "string", "Record_Type_Parent": "Character" },
      { "name": "level", "type": "integer", "Record_Type_Parent": "Character" },
      { "name": "max_hp", "type": "integer", "Record_Type_Parent": "Character" },
      { "name": "current_hp", "type": "integer", "Record_Type_Parent": "Character" },
      { "name": "ac", "type": "integer", "Record_Type_Parent": "Character" },
      { "name": "staff", "type": "integer", "Record_Type_Parent": "Character" },
      { "name": "ability_name", "type": "string", "Record_Type_Parent": "AbilityScore" },
      { "name": "ability_score", "type": "integer", "Record_Type_Parent": "AbilityScore" },
      { "name": "item_type", "type": "string", "Record_Type_Parent": "Inventory" },
      { "name": "quantity", "type": "integer", "Record_Type_Parent": "Inventory" },
      { "name": "proof", "type": "integer", "Record_Type_Parent": "Inventory" }
    ],
    "Values": [] as any[]
  };

  // Add Character record
  bejson.Values.push([
    "Character", char.id, char.name, char.level, char.maxHp, char.currentHp, char.ac, char.staff,
    null, null, null, null, null
  ]);

  // Add AbilityScores
  for (const [ability, score] of Object.entries(char.stats)) {
    bejson.Values.push([
      "AbilityScore", char.id, null, null, null, null, null, null,
      ability, score, null, null, null
    ]);
  }

  // Add Inventory (Coins)
  bejson.Values.push([
    "Inventory", char.id, null, null, null, null, null, null,
    null, null, "Trump Casino Coins", char.coins, null
  ]);

  // Add Inventory (Vodkas)
  for (const vodka of char.vodkas) {
    bejson.Values.push([
      "Inventory", char.id, null, null, null, null, null, null,
      null, null, "Trump Vodka", vodka.quantity, vodka.proof
    ]);
  }

  return JSON.stringify(bejson, null, 2);
}

export function importCharacterFromBEJSON(jsonString: string): CharacterData {
  const parsed = JSON.parse(jsonString);
  if (parsed.Format !== "BEJSON" || parsed.Format_Version !== "104db") {
    throw new Error("Invalid BEJSON 104db format");
  }

  const char: CharacterData = {
    id: "",
    name: "",
    level: 1,
    maxHp: 10,
    currentHp: 10,
    ac: 10,
    stats: { Strength: 10, Dexterity: 10, Constitution: 10, Intelligence: 10, Wisdom: 10, Charisma: 10 },
    coins: 0,
    staff: 500,
    vodkas: []
  };

  const fields = parsed.Fields;
  const getIndex = (name: string) => fields.findIndex((f: any) => f.name === name);
  
  const idxType = getIndex("Record_Type_Parent");
  const idxId = getIndex("character_id");
  const idxName = getIndex("name");
  const idxLevel = getIndex("level");
  const idxMaxHp = getIndex("max_hp");
  const idxCurrentHp = getIndex("current_hp");
  const idxAc = getIndex("ac");
  const idxStaff = getIndex("staff");
  const idxAbilityName = getIndex("ability_name");
  const idxAbilityScore = getIndex("ability_score");
  const idxItemType = getIndex("item_type");
  const idxQuantity = getIndex("quantity");
  const idxProof = getIndex("proof");

  for (const record of parsed.Values) {
    const type = record[idxType];
    if (type === "Character") {
      char.id = record[idxId];
      char.name = record[idxName];
      char.level = record[idxLevel];
      char.maxHp = record[idxMaxHp];
      char.currentHp = record[idxCurrentHp];
      char.ac = record[idxAc];
      char.staff = record[idxStaff] ?? 500;
    } else if (type === "AbilityScore") {
      const abilityName = record[idxAbilityName] as keyof CharacterData['stats'];
      if (char.stats[abilityName] !== undefined) {
        char.stats[abilityName] = record[idxAbilityScore];
      }
    } else if (type === "Inventory") {
      const itemType = record[idxItemType];
      if (itemType === "Trump Casino Coins") {
        char.coins = record[idxQuantity];
      } else if (itemType === "Trump Vodka") {
        char.vodkas.push({
          quantity: record[idxQuantity],
          proof: record[idxProof]
        });
      }
    }
  }

  return char;
}
