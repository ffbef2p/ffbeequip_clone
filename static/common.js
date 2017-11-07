var wikiBaseUrl = "http://exvius.gamepedia.com/";

var data;
var units;
var itemInventory;
var stat = '';
var types = [];
var elements = [];
var ailments = [];
var killers = [];
var accessToRemove = [];
var additionalStat = [];
var searchText = '';
var selectedUnit = '';
var server = "GL";
var baseStats = ['hp','mp','atk','def','mag','spr'];
var filters = ["types","elements","ailments","killers","accessToRemove","additionalStat"];
var elementList = ['fire','ice','lightning','water','earth','wind','light','dark'];
var ailmentList = ['poison','blind','sleep','silence','paralysis','confuse','disease','petrification','death'];
var killerList = ['aquatic','beast','bird','bug','demon','dragon','human','machine','plant','undead','stone','spirit'];
var typeList = ["dagger", "sword", "greatSword", "katana", "staff", "rod", "bow", "axe", "hammer", "spear", "harp", "whip", "throwing", "gun", "mace", "fist", "lightShield", "heavyShield", "hat", "helm", "clothes", "robe", "lightArmor", "heavyArmor", "accessory", "materia"];
var weaponList = ["dagger", "sword", "greatSword", "katana", "staff", "rod", "bow", "axe", "hammer", "spear", "harp", "whip", "throwing", "gun", "mace", "fist"];
var shieldList = ["lightShield", "heavyShield"];
var headList = ["hat", "helm"];
var bodyList = ["clothes", "robe", "lightArmor", "heavyArmor"];
var accessList = ["shop","chest","quest","trial","chocobo","event","colosseum","key","TMR-1*","TMR-2*","TMR-3*","TMR-4*","TMR-5*","recipe-shop","recipe-chest","recipe-quest","recipe-event","recipe-colosseum","recipe-key","trophy","recipe-trophy","premium"];

function getImageHtml(item) {
    var html = '<div class="td type">';
    if (item.special && item.special.includes("notStackable")) {
        html += "<img class='miniIcon left' src='img/notStackable.png' title='Not stackable'>";
    }
    if (item.special && item.special.includes("twoHanded")) {
        html += "<img class='miniIcon left' src='img/twoHanded.png' title='Two-handed'>";
    }
    if (item.icon) {
        html += "<img src='img/items/" + item.icon + "' class='icon'></img></div>";    
    } else if (item.type == "esper") {
        html += "<img src='img/" + escapeName(item.name) + ".png' class='icon'></img></div>";
    } else {
        html += "<img src='img/" + item.type + ".png' class='icon'></img></div>";
    }
    return html;
}

function getNameColumnHtml(item) {
    var html = '<div class="td name"><div>' + toLink(item.name);
    if (item.outclassedBy) {
        html += '<img src="img/gil.png" class="outclassedByIcon" title="Can be sold. Strictly outclassed by ' + item.outclassedBy + '"></img>';
    }
    html += "</div>";
    if (item.jpname) {
        html += '<div>' + item.jpname + "</div>";
    }
    html += "<div class='detail'>";
    if (item.type != "esper") { 
        html += "<img src='img/" + item.type + ".png' class='miniIcon'></img>";
    }
    html += getStatDetail(item) + "</div>"
    if (item.userPseudo) {
        html += "<div class='userPseudo'>item added by " + item.userPseudo + "</div>"
    }
    html += "</div>";

    
    return html;
}

function getElementHtml(elements) {
    var html = "<div class='specialValueGroup'>";
    for (var index in elements) {
        html += "<div class='specialValueItem'><div class='specialImg'><img class='miniIcon' src='img/sword.png'></img><img src='img/" + elements[index] + ".png'></img></div></div>"
    }
    html += "</div>"
    return html;
}

function getAilmentsHtml(item) {
    var html = "<div class='specialValueGroup'>";
    $(item.ailments).each(function(index, ailment) {
        html += "<div class='specialValueItem'><div class='specialImg noWrap ailment-" + ailment + "'><img class='miniIcon' src='img/sword.png'></img><img class='imageWithText' src='img/" + ailment.name + ".png'></img></div><div class='specialValue'>" + ailment.percent + "%</div></div>";
    });
    html += "</div>"
    return html;
}
function getResistHtml(item) {
    var html = "<div class='specialValueGroup'>";
    $(item.resist).each(function(index, resist) {
        html += "<div class='specialValueItem'><div class='specialImg noWrap resist-" + resist.name + "'><img class='miniIcon' src='img/heavyShield.png'></img><img class='imageWithText' src='img/" + resist.name + ".png'></img></div><div class='specialValue'>" + resist.percent + "%</div></div>";
    });
    html += "</div>"
    return html;
}
function getKillersHtml(item) {
    var html = "<div class='specialValueGroup'>";
    $(item.killers).each(function(index, killer) {
        if (killer.physical) {
            html += "<div class='specialValueItem'><div class='specialImg noWrap killer-" + killer.name + "'><img class='miniIcon' src='img/sword.png'></img><img class='imageWithText' src='img/killer.png'></img></div><div class='specialValue'>" + killer.name + "</div><div class='specialValue'>" + killer.physical + "%</div></div>";    
        }
        if (killer.magical) {
            html += "<div class='specialValueItem'><div class='specialImg noWrap killer-" + killer.name + "'><img class='miniIcon' src='img/rod.png'></img><img class='imageWithText' src='img/killer.png'></img></div><div class='specialValue'>" + killer.name + "</div><div class='specialValue'>" + killer.magical + "%</div></div>";
        }
    });
    html += "</div>"
    return html;
}
function getExclusiveUnitsHtml(item) {
    html = "<div class='exclusive'>Only ";
    var first = true;
    $(item.exclusiveUnits).each(function(index, exclusiveUnit) {
        if (first) {
            first = false;
        } else {
            html += ", ";
        }
        html += toLink(exclusiveUnit);
    });
    html += "</div>";
    return html;
}
function getSpecialHtml(item) {
    var special = "";
    $(item.special).each(function(index, itemSpecial) {
        if (itemSpecial != "twoHanded" && itemSpecial != "notStackable" && itemSpecial != "dualWield") {
            special += "<li>" + toHtml(itemSpecial) + "</li>";
        }
    });
    return special;
}

// Create an HTML span containing the stats of the item
var getStatDetail = function(item) {
    var detail = "";
    var first = true;
    $(baseStats).each(function(index, stat) {
        detail += "<span class='" + stat + "'>";
        
        if (item[stat]) {
            if (first) {
                first = false;
            } else {
                detail += ', ';
            }
            detail += stat + '+' + item[stat];
        }
        if (item[stat+'%']) {
            if (first) {
                first = false;
            } else {
                detail += ', ';
            }
            detail += stat + '+' + item[stat+'%'] + '%';
        }
        
        detail += "</span>";
        
    });
    return detail;
};

function getEquipedConditionHtml(item) {
    var conditions = "";
    var first = true;
    for(var equipedConditionsIndex in item.equipedConditions) {
        if (first) {
            first = false;
        } else {
            conditions += " and ";
        }
        conditions += "<img src='img/" + item.equipedConditions[equipedConditionsIndex] + ".png'></img>";
    }
    return "<div class='exclusive'>If equiped with " + conditions + "</div>";
}

function displayItemLine(item) {
    html = "";
    // type
    html += getImageHtml(item);

    // name
    html += getNameColumnHtml(item);

    // value
    html += '<div class="td value sort">' + item.calculatedValue;
    if (stat == 'inflict' || stat == 'evade' || stat == 'resist') {
        html += '%';
    }
    html += "</div>";
    
    // special
    html += '<div class="td special">';

    if (item.element) {
        html += getElementHtml(item.element);
    }
    if (item.ailments) {
        html += getAilmentsHtml(item);
    }
    if (item.resist) {
        html += getResistHtml(item);
    }

    if (item.killers) {
        html += getKillersHtml(item);
    }
    var special = "";
    if (item.special && item.special.includes("dualWield")) {
        special += "<li>" + toHtml("[Dual Wield|ability_72.png]") + "</li>";
    }
    if (item.partialDualWield) {
        special += "<li>" + toHtml("[Dual Wield|ability_72.png] of ")
        for (var index in item.partialDualWield) {
            special += "<img src='img/" + item.partialDualWield[index] + ".png'></img>";
        }
        special += "</li>";
    }
    if (item.allowUseOf) {
        special += "<li>Allow use of <img src='img/" + item.allowUseOf + ".png'></img></li>";
    }
    if (item.evade) {
        if (item.evade.physical) {
            special += "<li>Evade physical attacks " + item.evade.physical + "%</li>";    
        }
        if (item.evade.magical) {
            special += "<li>Evade magical attacks " + item.evade.magical + "%</li>";    
        }
    }
    if (item.singleWielding) {
        for (var index in baseStats) {
            if (item.singleWielding[baseStats[index]]) {
                special += "<li>Increase equipment " + baseStats[index].toUpperCase() + " (" + item.singleWielding[baseStats[index]] + "%) when single wielding</li>";    
            }
        }
    }
    if (item.singleWieldingOneHanded) {
        for (var index in baseStats) {
            if (item.singleWieldingOneHanded[baseStats[index]]) {
                special += "<li>Increase equipment " + baseStats[index].toUpperCase() + " (" + item.singleWieldingOneHanded[baseStats[index]] + "%) when single wielding a one-handed weapon</li>";    
            }
        }
    }

    if (item.accuracy) {
        special += "<li>Increase Accuracy: " + item.accuracy + "%</li>";
    }
    if (item.damageVariance) {
        special += "<li>Damage variance from x" + item.damageVariance.min + " to x"  + item.damageVariance.max + " (average : x" + (item.damageVariance.min + item.damageVariance.max)/2 + ")</li>";
    }
    if (item.special) {
        special += getSpecialHtml(item);
    }
    if (special.length != 0) {
        html += "<ul>" + special + "<ul>";
    }
    html += "</div>";


    //access
    html += '<div class="td access">';
    $(item.access).each(function(index, itemAccess) {
        html += "<div"; 
        if (accessToRemove.length != 0 && !isAccessAllowed(accessToRemove, itemAccess)) {
            html += " class='notSelected forbiddenAccess'";
        }
        html += ">" + itemAccess + "</div>"; 
    });
    if (item.tmrUnit) {
        html += '<div>' + toLink(item.tmrUnit) + '</div>';
    }
    if (item.exclusiveUnits) {
        html += getExclusiveUnitsHtml(item);
    }
    if (item.exclusiveSex) {
        html += "<div class='exclusive'>Only " + item.exclusiveSex + "</div>";
    }
    if (item.equipedConditions) {
        html += getEquipedConditionHtml(item);
    }
    html += "</div>";
    return html;
}

// Some field in the data can use a special syntax to display link to the wiki. This is done by using brace ( blabla [name] blabla). This replace the parts inside braces by html links.
var toHtml = function(text) {
    if (server == "GL") {
        var textWithAddedAnchors = text.replace(/(\[[^\]]*\])/g, function(v) {
            var vWithoutBrace = v.substring(1, v.length - 1); 
            var token = vWithoutBrace.split("|");
            var result = "";
            if (token.length == 2) {
                result += "<img class='icon' src='/img/items/" + token[1] + "'></img>"
            }
            result += '<a href="'+ toUrl(token[0]) +'">'+token[0] +'</a>'; 
            return result;
        });
        return "<span>" + textWithAddedAnchors +"</span>";
    } else {
        return "<span>" + text +"</span>";
    }
};

// Return the wiki url corresponding to the name
var toUrl = function(name) {
    return wikiBaseUrl + name.replace(' ', '_');
};

var toLink = function(text) {
    if (server == "GL") {
        return '<a href="' + toUrl(text) + '" target="_blank">' + text + '</a>';
    } else {
        return "<span>" + text + "</span>";
    }
}

function escapeName(string) {
    return String(string).replace(/[+%&': \(\)]/g, function (s) {
        return "_";
    });
}

// Function used to know if a keyboard key pressed is a number, to prevent non number to be entered
function isNumber(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if ( (charCode > 31 && charCode < 48) || charCode > 57) {
        return false;
    }
    return true;
};

function isNumberOrMinus(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if ( (charCode > 31 && charCode < 45) || (charCode > 54 && charCode < 48) || charCode > 57) {
        return false;
    }
    return true;
};

function isEnter(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    return charCode == 13;
};

// Get the values for a filter type
var getSelectedValuesFor = function(type) {
    var values = [];
        $('.active input[name='+ type +']').each(function() {
            values.push($(this).val());
        });
    return values;
};

// Selects the provided values on the filter of the provided type
function select(type, values) {
    $(values).each(function (index, value) {
        $("input[name='"+ type +"'][value='"+ value +"']").each(function(index, checkbox) {
            $(checkbox).prop('checked', true);
            $(checkbox).parent().addClass('active');
        });
    }) ;
};

// Add text choices to a filter. Type can be 'radio' of 'checkbox', depending if you want only one selection, or allow many.
function addTextChoicesTo(targetId, type, valueMap) {
	var target = $("#" + targetId);
	for (var key in valueMap) {
		addTextChoiceTo(target, targetId, type, valueMap[key], key);
	}
}

// Add image choices to a filter.
function addImageChoicesTo(targetId, valueList,type="checkbox",imagePrefix = "") {
	var target = $("#" + targetId);
	for (i = 0; i < valueList.length; i++) {
		addImageChoiceTo(target, targetId, valueList[i], type, imagePrefix);
	}
}

// Add one text choice to a filter
function addTextChoiceTo(target, name, type, value, label) {
	target.append('<label class="btn btn-default"><input type="' + type +'" name="' + name + '" value="'+value+'" autocomplete="off">'+label+'</label>');
}

// Add one image choice to a filter
function addImageChoiceTo(target, name, value, type="checkbox",imagePrefix = "") {
	target.append('<label class="btn btn-default"><input type="' + type + '" name="' + name + '" value="'+value+'" autocomplete="off"><img src="img/'+ imagePrefix + value+'.png"/></label>');
}

function loadInventory() {
    $.get('googleOAuthUrl', function(result) {
        $('<div id="dialog" title="Authentication">' + 
            '<h4>You\'ll be redirected to a google authentication page</h4><h5>This site is using <a href="https://en.wikipedia.org/wiki/OAuth" target="_blank">OAuth2 <span class="glyphicon glyphicon-question-sign"/></a> to access the stored inventory data, so it will never know your google login and password.</h5>' +
            '<h5>The data is stored on the secure FFBE Equip <a href="https://developers.google.com/drive/v3/web/appdata" target="_blank">app folder on Google Drive <span class="glyphicon glyphicon-question-sign"/></a>. FFBE Equip can only access this folder, and no personal file.</h5>' +
          '</div>' ).dialog({
            modal: true,
            open: function(event, ui) {
                $(this).parent().css('position', 'fixed');
            },
            position: { my: 'top', at: 'top+150' },
            buttons: {
                Ok: function() {
                    var state = {
                        "page": page,
                        "data": ""
                    };
                    if (window.location.hash && window.location.hash.length > 1) {
                        state.data = window.location.hash.substring(1);
                    }
                    if (window.location.host == "localhost:3000") {
                        state.dev = true;
                    }
                    window.location.href = result.url + "&state=" + encodeURIComponent(JSON.stringify(state));
                }
            }
        });
        
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
}

function logOut() {
    delete_cookie("googleOAuthAccessToken");
    window.location.reload();
}

function delete_cookie( name, path, domain ) {
    document.cookie = name + "=" +
        ((path) ? ";path="+path:"")+
        ((domain)?";domain="+domain:"") +
        ";expires=Thu, 01 Jan 1970 00:00:01 GMT";

}

function mergeArrayWithoutDuplicates(array1, array2) {
    var result = [].concat(array1);
    for (var index in array2) {
        if (!result.includes(array2[index])) {
            result.push(array2[index]);
        }
    }
    return result;
}

function switchTo(newServer) {
    if (newServer != server) {
        var serverParam = "";
        if (newServer == "JP") {
            serverParam = "?server=JP";
        }
        window.location.href = window.location.protocol + "//" + window.location.host + window.location.pathname + serverParam + window.location.hash;
    }
}

function getItemInventoryKey() {
    if (server == "JP") {
        return "name";
    } else {
        return "id";
    }
}

function readServerType() {
    if (window.location.href.indexOf("server=") > 0) {
        var captured = /server=([^&#]+)/.exec(window.location.href)[1];
        if (captured == "GL" || captured == "JP") {
            server = captured;
        } else {
            server = "GL";
        }
    } else {
        server = "GL";
    }
    if (server == "GL") {
        $(".switchServer .GL").addClass("btn-primary").removeClass("notSelected");
        $(".switchServer .JP").removeClass("btn-primary").addClass("notSelected");
        $(".jpWarning").addClass("hidden");
    } else {
        $(".switchServer .JP").addClass("btn-primary").removeClass("notSelected");
        $(".switchServer .GL").removeClass("btn-primary").addClass("notSelected");
        $(".jpWarning").removeClass("hidden");
    }
    updateLinks();
}

function updateLinks() {
    var serverParam = "";
    if (server == "JP") {
        serverParam = "?server=JP";
    } else {
        $("#linkToContribute").addClass("hidden");
    }
    $("#linkToSearch").prop("href","index.html" + serverParam);
    $("#linkToBuilder").prop("href","builder.html" + serverParam);
    $("#linkToContribute").prop("href","contribute.html" + serverParam);
}

// Filter the items according to the currently selected filters. Also if sorting is asked, calculate the corresponding value for each item
var filter = function(onlyShowOwnedItems = true, stat = "", baseStat = 0, searchText = "", selectedUnit = "", types = [], elements = [], ailments = [], killers = [], accessToRemove = [], additionalStat = "", showNotReleasedYet = false) {
    var result = [];
    for (var index in data) {
        var item = data[index];
        if (!onlyShowOwnedItems || itemInventory && itemInventory[item[getItemInventoryKey()]]) {
            if (showNotReleasedYet || !item.access.includes("not released yet")) {
                if (types.length == 0 || types.includes(item.type)) {
                    if (elements.length == 0 || (item.element && matches(elements, item.element)) || (elements.includes("noElement") && !item.element) || (item.resist && matches(elements, item.resist.map(function(resist){return resist.name;})))) {
                        if (ailments.length == 0 || (item.ailments && matches(ailments, item.ailments.map(function(ailment){return ailment.name;}))) || (item.resist && matches(ailments, item.resist.map(function(res){return res.name;})))) {
                            if (killers.length == 0 || (item.killers && matches(killers, item.killers.map(function(killer){return killer.name;})))) {
                                if (accessToRemove.length == 0 || haveAuthorizedAccess(accessToRemove, item)) {
                                    if (additionalStat.length == 0 || hasStats(additionalStat, item)) {
                                        if (searchText.length == 0 || containsText(searchText, item)) {
                                            if (selectedUnit.length == 0 || !exclusiveForbidAccess(item, selectedUnit)) {
                                                if (stat.length == 0 || hasStat(stat, item)) {
                                                    calculateValue(item, baseStat, stat, ailments, elements, killers);
                                                    result.push(item);
                                                }
                                            }
                                        }
                                    }
                                } 
                            }
                        }
                    }
                }
            }
        }
    }
    return result;
};

// Sort by calculated value (will be 0 if not sort is asked) then by name
var sort = function(items) {
    return items.sort(function (item1, item2){
		if (item2.calculatedValue == item1.calculatedValue) {
            var typeIndex1 = typeList.indexOf(item1.type);
            var typeIndex2 = typeList.indexOf(item2.type);
            if (typeIndex1 == typeIndex2) {
                return item1.name.localeCompare(item2.name);
            } else {
                return typeIndex1 - typeIndex2;
            }
		} else {
			return item2.calculatedValue - item1.calculatedValue;
		}
    });
};

// If sort is required, this calculate the effective value of the requested stat, based on the unit stat for percentage increase.
var calculateValue = function(item, baseStat, stat, ailments, elements, killers) {
    var calculatedValue = 0;
    if (item[stat] && stat != "evade") {
        calculatedValue = item[stat];
    } 
    if (item[stat + '%']) {
        calculatedValue += item[stat+'%'] * baseStat / 100;
    }
    if (item[stat] && stat == "evade") {
        if (item.evade.physical) {
            calculatedValue = item.evade.physical;
        }
        if (item.evade.magical && item.evade.magical > calculatedValue) {
            calculatedValue = item.evade.magical;
        }
    }
    if (stat == 'inflict' && (item.ailments || item.killers)) {
        var maxValue = 0;
        $(item.ailments).each(function(index, ailment) {
            if ((ailments.length == 0 || ailments.includes(ailment.name)) && ailment.percent > maxValue) {
                maxValue = ailment.percent;
            }
        });
        $(item.killers).each(function(index, killer) {
            if ((killers.length == 0 || killers.includes(killer.name))) {
                if (killer.physical > maxValue) {
                    maxValue = killer.physical;
                }
                if (killer.magical > maxValue) {
                    maxValue = killer.magical;
                }
            }
        });
        calculatedValue = maxValue;
    }
    if (stat == 'resist' && (item.resist)) {
        var maxValue = 0;
        $(item.resist).each(function(index, res) {
            if (ailmentList.includes(res.name) && (ailments.length == 0 || ailments.includes(res.name)) && res.percent > maxValue) {
                maxValue = res.percent;
            }
            if (elementList.includes(res.name) && (elements.length == 0 || elements.includes(res.name)) && res.percent > maxValue) {
                maxValue = res.percent;
            }
        });
        calculatedValue = maxValue;
    }
    item['calculatedValue'] = calculatedValue;
};

// Return true if the two arrays share at least one value
var matches = function(array1, array2) {
    var match = false;
    $(array1).each(function(index, value) {
        if (array2.includes(value)) {
            match = true;
        }
    });
    return match;
};

// Return true if the item is exclusive to something that does not matches the selected unit
var exclusiveForbidAccess = function(item, selectedUnit) {
    if (item.exclusiveSex && units[selectedUnit].sex != item.exclusiveSex) {
        return true;
    }
    if (item.exclusiveUnits && !item.exclusiveUnits.includes(selectedUnit)) {
        return true;
    }
    return false;
}

// Return true if the various fields of the items contains all the searched terms
var containsText = function(text, item) {
    
    var result = true;
    text.split(" ").forEach(function (token) {
        result = result && item.searchString.match(new RegExp(escapeRegExp(token),'i'));
    });
    return result;
};


// Return true if the item has the required stat
var hasStat = function(stat, item) {
    return item[stat] || item[stat+'%'] || (stat == 'inflict' && (item.element || item.ailments || item.killers)) || (stat == 'resist' && item.resist);
};

// Return true if the item has all the required stats
var hasStats = function(additionalStat, item) {
    var match = true;
    $(additionalStat).each(function(index, addStat) {
        if (!item[addStat] && !item[addStat + '%']) {
            match = false;
        }
    });
    return match;
};

// Return true if the item has at least one access that is not forbidden by filters
var haveAuthorizedAccess = function(forbiddenAccessList, item) {
    var hasAccess = false;
    if (forbiddenAccessList.includes("unitExclusive") && item.exclusiveUnits) {
        return false;
    }
    $(item.access).each(function(index, itemAccess) {
        hasAccess |= isAccessAllowed(forbiddenAccessList, itemAccess);
    });
    return hasAccess;
};

// Return true if one access is not forbidden by filters
var isAccessAllowed = function(forbiddenAccessList, access) {
    var accessAllowed = true;
    $(forbiddenAccessList).each(function (index, accessToSplit) {
        $(accessToSplit.split('/')).each(function(index, forbiddenAccess) {
            if (access.startsWith(forbiddenAccess) || access.endsWith(forbiddenAccess)) {
                accessAllowed = false;
            }    
        });
    });
    return accessAllowed;
}

// Escape RegExp special character if the user used them in his search
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}


function escapeQuote(string) {
    return String(string).replace(/[']/g, function (s) {
        return "\\'";
    });
}

function prepareSearch(data) {
    for (var index in data) {
        var item = data[index];
        var textToSearch = item["name"];
    
        if (server == "JP") {
            textToSearch += item["jpname"];
        }

        textToSearch += "|" + getStatDetail(item);
        if (item["evade"]) {
            if (item.evade.physical) {
                textToSearch += "|" + "Evade physical " + item.evade.physical + "%";
            }
            if (item.evade.magical) {
                textToSearch += "|" + "Evade magical " + item.evade.magical + "%";
            }
        }
        if (item["resist"]) {
            $(item["resist"]).each(function (index, resist) {
                textToSearch += "|" + resist.name;
            });
        }
        if (item["ailments"]) {
            $(item["ailments"]).each(function (index, ailment) {
                textToSearch += "|" + ailment.name;
            });
        }
        if (item["exclusiveUnits"]) {
            textToSearch += "|Only ";
            var first = true;
            $(item.exclusiveUnits).each(function(index, exclusiveUnit) {
                if (first) {
                    first = false;
                } else {
                    textToSearch += ", ";
                }
                textToSearch += exclusiveUnit;
            });
        }
        if (item["exclusiveSex"]) {
            textToSearch += "|Only " + item["exclusiveSex"]; 
        }
        if (item["condition"]) {
            textToSearch += "|Only " + item["condition"]; 
        }
        if (item["special"]) {
            $(item["special"]).each(function (index, special) {
                textToSearch += "|" + special;
            });
        }
        if (item.singleWielding) {
            textToSearch += "|" + "Increase equipment ATK (" + item.singleWielding["atk"] + "%) when single wielding";
        }
        if (item.singleWieldingOneHanded) {
            textToSearch += "|" + "Increase equipment ATK (" + item.singleWieldingOneHanded["atk"] + "%) when single wielding a one-handed weapon";
        }
        if (item.killers) {
            $(item["killers"]).each(function (index, killer) {
                textToSearch += "|killer " + killer.name;
            });
        }
        if (item["tmrUnit"]) {
            textToSearch += "|" + item["tmrUnit"]; 
        }
        for (var index in item.access) {
            textToSearch += "|" + item.access[index]; 
        }
        item.searchString = textToSearch;
    }
}

$(function() {
    readServerType();
    $.get(server + '/itemInventory', function(result) {
        itemInventory = result;
        $("#inventoryDiv .status").text("loaded (" + Object.keys(itemInventory).length + " items)");
        $("#inventoryDiv .loader").addClass("hidden");
        $(".logOut").removeClass("hidden");
        inventoryLoaded();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        $(".loadInventory").removeClass("hidden");
        $("#inventoryDiv .status").text("not loaded");
        $("#inventoryDiv .loader").addClass("hidden");
        if (notLoaded) {
            notLoaded();
        }
    });
});