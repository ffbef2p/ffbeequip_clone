var fs = require('fs');
var request = require('request');

var stats = ["HP","MP","ATK","DEF","MAG","SPR"];
var elements = ["fire", "ice", "lightning", "water", "wind", "earth", "light", "dark"];
var ailments = ["poison", "blind", "sleep", "silence", "paralysis", "confuse", "disease", "petrification"];

var typeMap = {
    1: 'dagger',
    2: 'sword',
    3: 'greatSword',
    4: 'katana',
    5: 'staff',
    6: 'rod',
    7: 'bow',
    8: 'axe',
    9: 'hammer',
    10: 'spear',
    11: 'harp',
    12: 'whip',
    13: 'throwing',
    14: 'gun',
    15: 'mace',
    16: 'fist',
    30: 'lightShield',
    31: 'heavyShield',
    40: 'hat',
    41: 'helm',
    50: 'clothes',
    51: 'lightArmor',
    52: 'heavyArmor',
    53: 'robe',
    60: 'accessory'
}

var raceMap = {
    1: 'beast',
    2: 'bird',
    3: 'aquatic',
    4: 'demon',
    5: 'human',
    6: 'machine',
    7: 'dragon',
    8: 'spirit',
    9: 'bug',
    10: 'stone',
    11: 'plant',
    12: 'undead'
}

var ailmentsMap = {
    "Poison": "poison",
    "Blind": "blind",
    "Sleep": "sleep",
    "Silence": "silence",
    "Paralyze": "paralysis",
    "Confusion": "confuse",
    "Disease": "disease",
    "Petrify": "petrification",
    "Death": "death"
}

var elementsMap = {
    "Fire": "fire",
    "Ice": "ice",
    "Lightning": "lightning",
    "Water": "water",
    "Wind": "wind",
    "Earth": "earth",
    "Light": "light",
    "Dark": "dark"
}

var unitNamesById = {};
var unitIdByTmrId = {};
var oldItemsAccessById = {};
var releasedUnits;
var skillNotIdentifiedNumber = 0;


console.log("Starting");
if (!fs.existsSync('../static/GL/data.json')) {
    console.log("old data not accessible");
    return;
}
request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe/master/equipment.json', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log("equipment.json downloaded");
        var items = JSON.parse(body);
        request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe/master/materia.json', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("materia.json downloaded");
                var materias = JSON.parse(body);
                request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe/master/skills.json', function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        console.log("skills.json downloaded");
                        var skills = JSON.parse(body);
                        request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe/master/units.json', function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                console.log("units.json downloaded");
                                var units = JSON.parse(body);
                                for (var unitIndex in units) {
                                    var unit = units[unitIndex];
                                    unitNamesById[unitIndex] = {"name":unit.name, "minRarity":unit.rarity_min};

                                    if (unit.TMR) {
                                        unitIdByTmrId[unit.TMR[1]] = unitIndex;
                                        if (unit.rarity_min > 3 && !unit.is_summonable) {
                                            unitNamesById[unitIndex].event = true;
                                        }
                                    }
                                }
                                
                                
                                
                                fs.readFile('../static/GL/data.json', function (err, content) {
                                    var oldItems = JSON.parse(content);
                                    for (var index in oldItems) {
                                        oldItemsAccessById[oldItems[index].id] = oldItems[index].access;
                                    }
                                    
                                    fs.readFile('../static/GL/releasedUnits.json', function (err, content) {
                                        releasedUnits = JSON.parse(content);
                                    
                                        var result = {"items":[]};
                                        for (var itemId in items) {
                                            treatItem(items,itemId, result, skills);
                                        }
                                        for (var materiaId in materias) {
                                            treatItem(materias,materiaId, result, skills);
                                        }
                                        console.log(skillNotIdentifiedNumber);
                                        fs.writeFileSync('data.json', formatOutput(result.items));
                                    });
                                });
                            }
                        });
                    }
                });
            }
        });
    }
});


function treatItem(items, itemId, result, skills) {
    var itemIn = items[itemId];
    if (itemIn.name.match(/[^\x00-\x7F]/) && !itemIn.name.startsWith("Firewall: Power") && !itemIn.name.startsWith("Copper Cuirass")) {
        // exclude item whose name contain non english char
        console.log("excluded : " + itemIn.name)
        return;
    }
    var itemOut = {};
    itemOut.id = itemId;
    itemOut.name = itemIn.name;
    if (itemIn.type_id) {
        itemOut.type = typeMap[itemIn.type_id];
    } else {
        itemOut.type = "materia";
    }
    readStats(itemIn, itemOut);
    if (itemIn.is_twohanded) {
        addSpecial(itemOut,"twoHanded");
    }
    if (itemIn.unique) {
        addSpecial(itemOut,"notStackable");
    }
    if (unitIdByTmrId[itemOut.id]) {
        var unit = unitNamesById[unitIdByTmrId[itemOut.id]];
        var access = "TMR-" + unit.minRarity + "*";
        if (unit.event) {
            access += "-event";
        }
        if (!releasedUnits[unit.name]) {
            addAccess(itemOut,"not released yet");
        }
        addAccess(itemOut,access);
        itemOut.tmrUnit = unit.name;
    }
    if (itemIn.requirements) {
        if (itemIn.requirements[0] == "SEX") {
            if (itemIn.requirements[1] == 1) {
                itemOut.exclusiveSex = "male";
            } else if (itemIn.requirements[1] == 2) {
                itemOut.exclusiveSex = "female";
            }
        } else if (itemIn.requirements[0] == "UNIT_ID") {
            var unit = unitNamesById[itemIn.requirements[1]];
            addExclusiveUnit(itemOut, unit.name);
        }
    }
    
    if (itemIn.accuracy) {
        addStat(itemOut,"accuracy",itemIn.accuracy);
    }
    
    if (itemIn.dmg_variance) {
        itemOut.damageVariance = {"min":itemIn.dmg_variance[0],"max":itemIn.dmg_variance[1]};
    }
    
    if (itemIn.icon) {
        itemOut.icon = itemIn.icon;
    }
    
    if (!itemOut.access && oldItemsAccessById[itemOut.id]) {
        for (var index in oldItemsAccessById[itemOut.id]) {
            var access = oldItemsAccessById[itemOut.id][index];
            if (access != "not released yet") {
                addAccess(itemOut, access);
            }
        }
    }
    if (!itemOut.access) {
        itemOut.access = ["not released yet"];
    }
    if (!oldItemsAccessById[itemOut.id]) {
        console.log("new item : " + itemOut.id + " - " + itemOut.name);
    }

    result.items = result.items.concat(readSkills(itemIn, itemOut,skills));
}

function readStats(itemIn, itemOut) {
    if (itemIn.stats) {
        for (var statsIndex in stats) {
            var stat = stats[statsIndex];
            if (itemIn.stats[stat] != 0) {
                itemOut[stat.toLowerCase()] = itemIn.stats[stat];
            }    
        }
        if (itemIn.stats.element_inflict) {
            itemOut.element = [];
            for (var elementIndex in itemIn.stats.element_inflict) {
                itemOut.element.push(elementsMap[itemIn.stats.element_inflict[elementIndex]]);
            }
        }
        if (itemIn.stats.element_resist) {
            itemOut.resist = [];
            for (var element in itemIn.stats.element_resist) {
                itemOut.resist.push({"name":elementsMap[element],"percent":itemIn.stats.element_resist[element]})
            }
        }
        if (itemIn.stats.status_resist) {
            if (!itemOut.resist) {
                itemOut.resist = [];
            }
            for (var status in itemIn.stats.status_resist) {
                itemOut.resist.push({"name":ailmentsMap[status],"percent":itemIn.stats.status_resist[status]})
            }
        }   
        if (itemIn.stats.status_inflict) {
            itemOut.ailments = [];
            for (var status in itemIn.stats.status_inflict) {
                itemOut.ailments.push({"name":ailmentsMap[status],"percent":itemIn.stats.status_inflict[status]})
            }
        }
    }
}

function readSkills(itemIn, itemOut, skills) {
    var result = [];
    if (itemIn.skills) {
        var masterySkills = [];
        var restrictedSkills = [];
        for (var skillIndex in itemIn.skills) {
            var skillId = itemIn.skills[skillIndex];
            var skill = skills[skillId];
            if (skill) {
                if (skill.type == "MAGIC") {
                    addSpecial(itemOut, getSkillString(skill));
                } else if (skill.unit_restriction) {
                    restrictedSkills.push(skill);
                } else {
                    var effectsNotTreated = [];
                    for (var rawEffectIndex in skill.effects_raw) {
                        rawEffect = skill.effects_raw[rawEffectIndex];

                        // Mastery (+X% stat if equiped with ...)
                        if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 6) {
                            masterySkills.push(rawEffect[3]);
                            
                        } else {
                            if (!addEffectToItem(itemOut, skill, rawEffectIndex, skills)) {
                                effectsNotTreated.push(rawEffectIndex)
                                //console.log(rawEffect + " - " + skill.effects);
                            }
                        }            
                    }
                    addNotTreatedEffects(itemOut, effectsNotTreated, skill);
                }
            }
        }
        var emptyItem = isItemEmpty(itemOut);
        if ((masterySkills.length == 0 && restrictedSkills.length ==0) || !emptyItem) {
            result.push(itemOut);
        }
        
        for (var masteryIndex in masterySkills) {
            var lenght = result.length;
            for (var itemIndex = 0; itemIndex < lenght; itemIndex++) {
                if (!result[itemIndex].equipedConditions || result[itemIndex].equipedConditions.length < 2) {
                    var copy = JSON.parse(JSON.stringify(result[itemIndex]));
                    addMastery(copy, masterySkills[masteryIndex]);
                    result.push(copy);
                }
            }
            if (emptyItem) {
                var copy = JSON.parse(JSON.stringify(itemOut));
                addMastery(copy, masterySkills[masteryIndex]);
                result.push(copy);
            }
        }
        for (var restrictedIndex in restrictedSkills) {
            var skill = restrictedSkills[restrictedIndex];
            var effectsNotTreated = [];
            var lenght = result.length;
            for (var itemIndex = 0; itemIndex < lenght; itemIndex++) {
                var copy = JSON.parse(JSON.stringify(result[itemIndex]));
                var unitFoud = false;
                for (var restrictedUnitIndex in skill.unit_restriction) {
                    if (unitNamesById[skill.unit_restriction[restrictedUnitIndex]]) {
                        addExclusiveUnit(copy, unitNamesById[skill.unit_restriction[restrictedUnitIndex]].name);
                        unitFoud = true;
                    }
                }
                if (!unitFoud) { console.log("No units found in " + JSON.stringify(skill.unit_restriction) + " for skill " + skill.name );}
                for (var rawEffectIndex in skill.effects_raw) {
                    rawEffect = skill.effects_raw[rawEffectIndex];
                    if (!addEffectToItem(copy, skill, rawEffectIndex, skills)) {
                        effectsNotTreated.push(rawEffectIndex);
                    }
                }
                addNotTreatedEffects(copy, effectsNotTreated, skill);
                result.push(copy);
            }
            if (emptyItem) {
                var copy = JSON.parse(JSON.stringify(itemOut));
                var unitFoud = false;
                for (var restrictedUnitIndex in skill.unit_restriction) {
                    if (unitNamesById[skill.unit_restriction[restrictedUnitIndex]]) {
                        addExclusiveUnit(copy, unitNamesById[skill.unit_restriction[restrictedUnitIndex]].name);
                        unitFoud = true;
                    }
                }
                if (!unitFoud) { console.log("No units found in " + JSON.stringify(skill.unit_restriction) + " for skill " + skill.name );}
                for (var rawEffectIndex in skill.effects_raw) {
                    rawEffect = skill.effects_raw[rawEffectIndex];
                    if (!addEffectToItem(copy, skill, rawEffectIndex, skills)) {
                        effectsNotTreated.push(rawEffectIndex);
                    }
                }
                addNotTreatedEffects(copy, effectsNotTreated, skill);
                result.push(copy);
            }
        }
    } else {
        result.push(itemOut);
    }
    return result;
}

function addNotTreatedEffects(itemOut, effectsNotTreated, skill) {
    if (effectsNotTreated.length > 0) {
        var special = "[" + skill.name;
        if (skill.icon) {
            special += "|" + skill.icon;
        }
        special += "]:"
        var first = true;
        for (var index in effectsNotTreated) {
            if (first) {
                first = false;
            } else {
                special += ", ";
            }
            special += skill.effects[effectsNotTreated[index]];
        }
        addSpecial(itemOut, special);
    }
}

function addEffectToItem(item, skill, rawEffectIndex, skills) {
    var rawEffect = skill.effects_raw[rawEffectIndex];
    // + X % to a stat
    if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 1) {
        var effectData = rawEffect[3]            
        addStat(item, "hp%", effectData[4]);
        addStat(item, "mp%", effectData[5]);
        addStat(item, "atk%", effectData[0]);
        addStat(item, "def%", effectData[1]);
        addStat(item, "mag%", effectData[2]);
        addStat(item, "spr%", effectData[3]);

    // DualWield
    } else if (rawEffect[1] == 3 && rawEffect[2] == 14 && (rawEffect[0] == 0 || rawEffect[0] == 1)) {
        if (rawEffect[3].length == 1 && rawEffect[3][0] == "none") {
            addSpecial(item,"dualWield");
        } else {
            item.partialDualWield = [];
            for (var dualWieldType in rawEffect[3]) {
                var typeId = rawEffect[3][dualWieldType];
                item.partialDualWield.push(typeMap[typeId]);
            }
        }

    // killers
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 11) {
        addKiller(item, rawEffect[3][0],rawEffect[3][1],rawEffect[3][2]);

    // evade
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 22) {
        if (!item.evade) {
            item.evade = {};
        }
        item.evade.physical = rawEffect[3][0];    
    
    // magical evade
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 54 && rawEffect[3][0] == -1) {
        if (!item.evade) {
            item.evade = {};
        }
        item.evade.magical = rawEffect[3][1];

    // Auto- abilities
    } else if (rawEffect[0] == 1 && rawEffect[1] == 3 && rawEffect[2] == 35) {
        addSpecial(item, "Gain at the start of a battle: " + getSkillString(skills[rawEffect[3][0]]));

    // Element Resist
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 3) {
        addElementalResist(item, rawEffect[3]);

    // Ailments Resist
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 2) {
        addAilmentResist(item, rawEffect[3]);

    // Equip X
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 5) {
        item.allowUseOf = typeMap[rawEffect[3]];
        
    // Doublehand
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 13) {
        if (rawEffect[3][2] == 0) {
            if (!item.singleWieldingOneHanded) {item.singleWieldingOneHanded = {}};
            addStat(item.singleWieldingOneHanded,"atk",rawEffect[3][0]);    
        } else if (rawEffect[3][2] == 0) {
            if (!item.singleWielding) {item.singleWielding = {}};
            addStat(item.singleWielding,"atk",rawEffect[3][0]);    
        }
        addStat(item,"accuracy",rawEffect[3][1]);
        
    } else {
        return false;
    }
    return true;
}

function addSpecial(item, special) {
    if (!item.special) {
        item.special = [];
    }
    item.special.push(special);
}

function addStat(item, stat, value) {
    if (value != 0) {
        if (!item[stat]) {
            item[stat] = 0;
        }
        item[stat] += value;
    }
}

function addKiller(item, raceId, physicalPercent, magicalPercent) {
    var race = raceMap[raceId];
    if (!item.killers) {
        item.killers = [];
    }
    var killer = {"name":race};
    if (physicalPercent) {
        killer.physical = physicalPercent;
    }
    if (magicalPercent) {
        killer.magical = magicalPercent;
    }
    item.killers.push(killer);
}

function getSkillString(skill) {
    var first = true;
    var effect = "";
    for (var effectIndex in skill.effects) {
        if (first) {
            first = false;
        } else {
            effect += ", ";
        }
        effect += skill.effects[effectIndex];
    }
    var result = "[" + skill.name;
    if (skill.icon) {
        result += "|" + skill.icon;
    }
    result += "]: " + effect;
    return result;
}

function addElementalResist(item, values) {
    if (!item.resist) {
        item.resist = [];
    }
    for (var index in elements) {
        if (values[index]) {
            item.resist.push({"name":elements[index],"percent":values[index]})
        }
    }
}

function addAilmentResist(item, values) {
    if (!item.resist) {
        item.resist = [];
    }
    for (var index in ailments) {
        if (values[index]) {
            item.resist.push({"name":ailments[index],"percent":values[index]})
        }
    }
}

function addMastery(item, mastery) {
    if (!item.equipedConditions) {
        item.equipedConditions = [];
    }
    item.equipedConditions.push(typeMap[mastery[0]]);
    addStat(item, "atk%", mastery[1]);
    addStat(item, "def%", mastery[2]);
    addStat(item, "mag%", mastery[3]);
    addStat(item, "spr%", mastery[4]);
}

function addExclusiveUnit(item, name) {
    if (!item.exclusiveUnits) {
        item.exclusiveUnits = [];
    }
    item.exclusiveUnits.push(name);
}

function isItemEmpty(item) {
    for (var index in stats) {
        if (item[stats[index].toLowerCase()]) {
            return false;
        }
        if (item[stats[index].toLowerCase() + "%"]) {
            return false;
        }
    }
    if (item.special) {
        for (var index in item.special) {
            if (item.special[index] != "twoHanded" && item.special[index] != "notStackable") {
                return false;   
            }
        }
    }
    if (item.resist) {
        return false;
    }
    return true;
}

function addAccess(item, access) {
    if (!item.access) {
        item.access = [];
    }
    item.access.push(access);
}

function formatOutput(items) {
    var properties = ["id","name","type","hp","hp%","mp","mp%","atk","atk%","def","def%","mag","mag%","spr","spr%","evade","singleWieldingOneHanded","singleWielding","accuracy","damageVariance","element","partialDualWield","resist","ailments","killers","special","allowUseOf","exclusiveSex","exclusiveUnits","equipedConditions","tmrUnit","access","icon"];
    var result = "[\n";
    var first = true;
    for (var index in items) {
        var item = items[index]
        if (first) {
            first = false;
        } else {
            result += ",";
        }
        result += "\n\t{";
        var firstProperty = true;
        for (var propertyIndex in properties) {
            var property = properties[propertyIndex];
            if (item[property]) {
                if (firstProperty) {
                    firstProperty = false;
                } else {
                    result += ", ";
                }
                result+= "\"" + property + "\":" + JSON.stringify(item[property]);
            }
        }
        result += "}";
    }
    result += "\n]";
    return result;
}