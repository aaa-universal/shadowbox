function getInputValue( id ) {
    var ibox = document.getElementById( id );
    var inches = ibox.value;
    if( isNaN( inches ) || inches < 0 ) {
        alert( "Invalid number of inches: " + inches );
        ibox.focus();
        return -1;
    }
    return Number(inches) + Number(document.getElementById( id + "f" ).value);
}

function getNumberValue( name, value ) {
    if( isNaN( value ) || value < 0 ) {
        alert( "Invalid " + name + ": " + value );
        return -1;
    }
    return Number(value)
}

function addObstacle( id ) {
    var obReg = /O([0-9]+)\s*=\s*\[\s*[0-9.]+\s*\|\s*[0-9.]+\s*\]\s*$/;
    
    var obStart = getInputValue( "obstacleStart" + id );
    if( obStart < 0 ) return;
    
    var obWidth = getInputValue( "obstacleWidth" + id );
    if( obWidth < 0 ) return;
    
    var obNum = 1;
    var obstacles = document.getElementById( "obstacles" + id );
    var curr = obstacles.value.trim();
    if( curr != "" ) {
        if( curr.match( obReg ) == null ) {
            alert( "Invalid obstacles format: " + curr );
            return false;
        }
        obNum = getNumberValue( "format: obstacle number", RegExp.$1 );
        if( obNum < 0 ) return false;
        obNum++;
    }
    obstacles.value += "O" + obNum + "=[" + obStart + "|" + obWidth + "] ";
    document.getElementById( "obstacleStart" + id ).value = "";
    document.getElementById( "obstacleStart" + id + "f" ).value = "";
    return true;
}

function parseObstacleValues( obsValues, obstacles ) {
    var boxReg = /^\s*O([0-9]+)\s*=\s*\[\s*([0-9.]+)\s*\|\s*([0-9.]+)\s*$/;
    var boxData = obstacles.trim();
    if( boxData == "" ) return true;
    
    var obsNum = 0;
    var i, bNum, bStart, bWidth;
    var boxes = boxData.split( ']' );
    var boxCount = boxes.length;
    if( boxes[boxCount-1] != "" ) {
        alert( "Invalid obstacle format: tail: " + boxes[boxCount-1] );
        return false;
    }
    for( i=1; i<boxCount; i++ ) {
        if( boxes[i-1].match( boxReg ) == null ) {
            alert( "Invalid format: obstacle " + i );
            return false;
        }
        bNum = getNumberValue( "format: obstacle " + i + " number", RegExp.$1 );
        if( bNum < 0 ) return false;
        if( bNum != i ) {
            alert( "Invalid format: obstacle " + i + " number: " + bNum );
            return false;
        }
        bStart = getNumberValue( "format: obstacle " + i + " start", RegExp.$2 );
        if( bStart < 0 ) return false;
        bWidth = getNumberValue( "format: obstacle " + i + " width", RegExp.$3 );
        if( bWidth < 0 ) return false;
        
        obsValues[obsNum++] = bStart;
        obsValues[obsNum++] = bStart + bWidth;
    }
    return true;
}

function parseSideValues( sideValues, plan, sideWidth ) {
    var boxReg = /^\s*B([0-9]+)\s*=\s*\[\s*([0-9.]+)\s*\|\s*([0-9.]+)\s*$/;
    var boxData = plan.trim();
    if( boxData == "" ) return true;
    
    var sideNum = 0;
    var i, bNum, bStart, bWidth;
    var boxes = boxData.split( ']' );
    var boxCount = boxes.length;
    if( boxes[boxCount-1] != "" ) {
        alert( "Invalid box format: tail: " + boxes[boxCount-1] );
        return false;
    }
    for( i=1; i < boxCount; i++ ) {
        if( boxes[i-1].match( boxReg ) == null ) {
            alert( "Invalid format: box " + i );
            return false;
        }
        bNum = getNumberValue( "format: box " + i + " number", RegExp.$1 );
        if( bNum < 0 ) return false;
        if( bNum != i ) {
            alert( "Invalid format: box " + i + " number: " + bNum );
            return false;
        }
        bStart = getNumberValue( "format: box " + i + " start", RegExp.$2 );
        if( bStart < 0 ) return false;
        bWidth = getNumberValue( "format: box " + i + " width", RegExp.$3 );
        if( bWidth < 0 ) return false;
        
        sideValues[sideNum++] = bStart;
        sideValues[sideNum++] = bStart + sideWidth;
        sideValues[sideNum++] = bStart + bWidth - sideWidth;
        sideValues[sideNum++] = bStart + bWidth;
    }
    return true;
}

function updateSideValues( sideValues, wallLength, startDist, boxDist, sideWidth ) {
    var sideSize = sideValues.length;
    if( sideSize == 0 ) return 0;
    
    var bStart = startDist;
    var bWidth, i = 0;
    while( i < sideSize ) {
        bWidth = sideValues[i+3] - sideValues[i];
        sideValues[i++] = bStart;
        sideValues[i++] = bStart + sideWidth;
        sideValues[i++] = bStart + bWidth - sideWidth;
        sideValues[i++] = bStart + bWidth;
        bStart += bWidth + boxDist;
    }
    return wallLength - (bStart - boxDist);
}

function getConflict( sideValues, obsValues ) {
    var sideSize = sideValues.length;
    var obsSize = obsValues.length;
    var i, s;
    
    for( i=0; i < obsSize; i=i+2 ) {
        obs = obsValues[i];
        obe = obsValues[i+1];
        for( s=0; s < sideSize; s=s+2 ) {
            if( obe > sideValues[s] && obs < sideValues[s+1] ) {
                return Math.floor( s / 4 ) + 1;
            }
        }
    }
    return 0;
}

function getPix( inches, factor ) {
    return Math.ceil( inches * factor );
}

function drawBox( ctx, boxNum, leftStart, leftEnd, rightStart, rightEnd, boxHeight, factor ) {
    var outX = getPix( leftStart, factor );
    var outY = getPix( 3, factor );
    var outW = getPix( rightEnd - leftStart, factor );
    var outH = getPix( boxHeight, factor );
    ctx.fillStyle = "#A0A0A0";
    ctx.fillRect( outX, outY, outW, outH );
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect( outX+1, outY+1, outW-2, outH-2 );
    var sideW = getPix( leftEnd - leftStart, factor );
    var inX = outX + sideW - 1;
    var inY = outY + sideW - 1;
    var inW = outW - sideW - sideW + 2;
    var inH = outH - sideW - sideW + 2;
    ctx.fillStyle = "#A0A0A0";
    ctx.fillRect( inX, inY, inW, inH );
    ctx.fillStyle = "#C0DDC0";
    ctx.fillRect( inX+1, inY+1, inW-2, inH-2 );
    if( boxNum > 0 ) {
        ctx.fillStyle = "#607760";
        ctx.fillText( boxNum, inX+4, inY+4 );
    }
}

function drawObstacle( ctx, sideValues, obsStart, obsEnd, obsDrop, factor ) {
    var outX = getPix( obsStart, factor );
    var outY = getPix( obsDrop, factor );
    var outW = getPix( obsEnd - obsStart, factor );
    var outH = getPix( 4, factor );
    
    var fillColor = "#FFFFFF";
    var obsValues = new Array();
    obsValues[0] = obsStart;
    obsValues[1] = obsEnd;
    var conflictBoxNum = getConflict( sideValues, obsValues );
    if( conflictBoxNum > 0 ) {
        fillColor = "#FFAAAA";
    }
    ctx.fillStyle = "#A0A0A0";
    ctx.fillRect( outX, outY, outW, outH );
    ctx.fillStyle = fillColor;
    ctx.fillRect( outX+1, outY+1, outW-2, outH-2 );
    return conflictBoxNum;
}

function drawPlan( id, planNum ) {
    var plan = document.getElementById( "plan" + id + "text" + planNum );
    var planItems = plan.value.split( '\n' );
    if( planItems.length < 3 ) {
        alert( "Invalid plan: " + planItems.length + " lines, expected 3" );
    }
    // "WL=240 SD=3.25 BD=3.25 ED=3.75 SW=1.5 BH=24";
    var paramReg = /^\s*WL\s*=\s*([0-9.]+)\s+SD\s*=\s*([0-9.]+)\s+BD\s*=\s*([0-9.]+)\s+ED\s*=\s*([0-9.]+)\s+SW\s*=\s*([0-9.]+)\s+BH\s*=\s*([0-9.]+)\s*[\r]*$/;
    var params = planItems[0];
    if( params.match( paramReg ) == null ) {
        alert( "Invalid parameter format:\n" + params );
        return false;
    }
    var wallLength = getNumberValue( "parameter format: WL", RegExp.$1 );
    if( wallLength < 0 ) return false;
    var startDist = getNumberValue( "parameter format: SD", RegExp.$2 );
    if( startDist < 0 ) return false;
    var boxDist = getNumberValue( "parameter format: BD", RegExp.$3 );
    if( boxDist < 0 ) return false;
    var endDist = getNumberValue( "parameter format: ED", RegExp.$4 );
    if( endDist < 0 ) return false;
    var sideWidth = getNumberValue( "parameter format: SW", RegExp.$5 );
    if( sideWidth < 0 ) return false;
    var boxHeight = getNumberValue( "parameter format: BH", RegExp.$6 );
    if( boxHeight < 0 ) return false;
    
    var obstacles = planItems[1];
    var obsValues = new Array();
    if( parseObstacleValues( obsValues, obstacles ) == false ) return false;
    
    var boxes = planItems[2];
    var sideValues = new Array();
    if( parseSideValues( sideValues, boxes, sideWidth ) == false ) return false;
    
    // update plan based on local edits
    endDist = updateSideValues( sideValues, wallLength, startDist, boxDist, sideWidth );
    
    var factor = 4;  // 4 pixels per inch
    if( document.getElementById( "plan" + id + "zoom" + planNum ).checked ) {
        factor = 8;
    }
    var canvas = document.getElementById( "plan" + id + "canvas" + planNum );
    var wallLengthPix = getPix( wallLength, factor );
    var wallHeightPix = getPix( boxHeight + 10, factor );
    canvas.width = wallLengthPix;
    canvas.height = wallHeightPix;
    var ctx = canvas.getContext( "2d" );
    ctx.font = "10pt Arial";
    ctx.textBaseline = "top";
    
    boxes = "";
    var labels = document.getElementById( "plan" + id + "labels" + planNum ).checked;
    var sideSize = sideValues.length;
    var boxNum = 0;
    var label = 0;
    var i = 0;
    while( i < sideSize ) {
        boxNum++;
        boxes += "B" + boxNum + "=[" + sideValues[i] + "|" + (sideValues[i+3] - sideValues[i]) + "] ";
        if( labels ) label = boxNum;
        drawBox( ctx, label, sideValues[i], sideValues[i+1], sideValues[i+2], sideValues[i+3], boxHeight, factor );
        i += 4;
    }
    
    var conflict, conflictBoxNum = 0;
    var obsDrop = Math.ceil(boxHeight / 2) + 3;
    var obsSize = obsValues.length;
    i = 0;
    while( i < obsSize ) {
        conflict = drawObstacle( ctx, sideValues, obsValues[i], obsValues[i+1], obsDrop, factor );
        if( conflict > 0 && ( conflictBoxNum == 0 || conflictBoxNum > conflict ) ) {
            conflictBoxNum = conflict;
        }
        i += 2;
    }
    var stat = document.getElementById( "plan" + id + "status" + planNum );
    if( endDist < 0 ) {
        if( conflictBoxNum == 0 ) {
            conflictBoxNum = boxNum;
        }
        endDist = 0;
    }
    if( conflictBoxNum == 0 ) {
        stat.value = "ok - " + boxNum + " boxes";
    }
    else {
        stat.value = "conflict box " + conflictBoxNum;
    }
    var boardY = getPix( boxHeight + 6, factor );
    var boardH = getPix( 4, factor );
    ctx.fillStyle="#A0A0A0";
    ctx.fillRect( 0, boardY, wallLengthPix, boardH );
    ctx.fillStyle="#FFFFFF";
    ctx.fillRect( 0, boardY+1, wallLengthPix, boardH-1 );
    
    // show updated plan
    params = "WL=" + wallLength + " SD=" + startDist + " BD=" + boxDist + 
             " ED=" + endDist + " SW=" + sideWidth + " BH=" + boxHeight;
    
    plan.value = params + "\n" + obstacles + "\n" + boxes;
}

function deletePlan( id, planNum ) {
    var row = document.getElementById( "plan" + id + "row" + planNum );
    row.parentNode.deleteRow( row.sectionRowIndex );
}

function addPlan( id, planNum, params, obstacles, boxes, sideWidth ) {
    var showAll = document.getElementById( "showAll" + id ).checked;
    
    var obsValues = new Array();
    if( parseObstacleValues( obsValues, obstacles ) == false ) return false;
    
    var sideValues = new Array();
    if( parseSideValues( sideValues, boxes, sideWidth ) == false ) return false;
    
    var conflictBoxNum = getConflict( sideValues, obsValues );
    if( conflictBoxNum > 0 && showAll == false ) return false;
    
    // add elements and canvas
    var tbody = document.getElementById( "plan" + id );
    var row = document.createElement( "tr" );
    row.setAttribute( "id", "plan" + id + "row" + planNum );
    var td = document.createElement( "td" );
    td.setAttribute( "class", "planCell" );
    
    var ta = document.createElement( "textarea" );
    ta.setAttribute( "name", "plan" + id + "text" + planNum );
    ta.setAttribute( "id", "plan" + id + "text" + planNum );
    ta.setAttribute( "cols", "100" );
    ta.setAttribute( "rows", "4" );
    ta.value = params + "\n" + obstacles + "\n" + boxes;
    td.appendChild( ta );
    
    var vt = document.createElement( "table" );
    vt.setAttribute( "class", "vsepTable" );
    var vtr = vt.insertRow( 0 );
    
    var vtd = document.createElement( "td" );
    vtd.setAttribute( "class", "vsepCell" );
    var upb = document.createElement( "input" );
    upb.setAttribute( "class", "buttonFont" );
    upb.setAttribute( "type", "button" );
    upb.setAttribute( "name", "plan" + id + "update" + planNum );
    upb.setAttribute( "value", "Update Plan" );
    upb.setAttribute( "onClick", "drawPlan( " + id + ", " + planNum + " )" );
    vtd.appendChild( upb );
    vtr.appendChild( vtd );
    
    vtd = document.createElement( "td" );
    vtd.setAttribute( "class", "vsepCell" );
    var status = document.createElement( "span" );
    status.setAttribute( "class", "inputFont" );
    status.appendChild( document.createTextNode( "Status: " ) );
    vtd.appendChild( status );
    var stat = document.createElement( "input" );
    stat.setAttribute( "type", "text" );
    stat.setAttribute( "name", "plan" + id + "status" + planNum );
    stat.setAttribute( "id", "plan" + id + "status" + planNum );
    stat.setAttribute( "size", "18" );
    stat.setAttribute( "style", "background-color: #D4D1C8; border:1px solid #6F7E97" );
    stat.setAttribute( "readonly", "readonly" );
    vtd.appendChild( stat );
    vtr.appendChild( vtd );
    
    vtd = document.createElement( "td" );
    vtd.setAttribute( "class", "vsepCell" );
    var zoom = document.createElement( "input" );
    zoom.setAttribute( "type", "checkbox" );
    zoom.setAttribute( "name", "plan" + id + "zoom" + planNum );
    zoom.setAttribute( "id", "plan" + id + "zoom" + planNum );
    zoom.setAttribute( "onClick", "drawPlan( " + id + ", " + planNum + " )" );
    vtd.appendChild( zoom );
    var zoomin = document.createElement( "span" );
    zoomin.setAttribute( "class", "inputFont" );
    zoomin.appendChild( document.createTextNode( "\u00a0Zoom In" ) );
    vtd.appendChild( zoomin );
    vtr.appendChild( vtd );
    
    vtd = document.createElement( "td" );
    vtd.setAttribute( "class", "vsepCell" );
    var lbl = document.createElement( "input" );
    lbl.setAttribute( "type", "checkbox" );
    lbl.setAttribute( "name", "plan" + id + "labels" + planNum );
    lbl.setAttribute( "id", "plan" + id + "labels" + planNum );
    lbl.setAttribute( "onClick", "drawPlan( " + id + ", " + planNum + " )" );
    vtd.appendChild( lbl );
    var labels = document.createElement( "span" );
    labels.setAttribute( "class", "inputFont" );
    labels.appendChild( document.createTextNode( "\u00a0Labels" ) );
    vtd.appendChild( labels );
    vtr.appendChild( vtd );
    
    vtd = document.createElement( "td" );
    vtd.setAttribute( "class", "vsepCell" );
    var deb = document.createElement( "input" );
    deb.setAttribute( "class", "buttonFont" );
    deb.setAttribute( "type", "button" );
    deb.setAttribute( "name", "plan" + id + "delete" + planNum );
    deb.setAttribute( "value", "Delete Plan" );
    deb.setAttribute( "onClick", "deletePlan( " + id + ", " + planNum + " )" );
    vtd.appendChild( deb );
    vtr.appendChild( vtd );
    td.appendChild( vt );
    
    var canvas = document.createElement( "canvas" );
    canvas.setAttribute( "name", "plan" + id + "canvas" + planNum );
    canvas.setAttribute( "id", "plan" + id + "canvas" + planNum );
    canvas.setAttribute( "width", "800" );
    canvas.setAttribute( "height", "200" );
    td.appendChild( canvas );
    
    row.appendChild( td );
    tbody.appendChild( row );
    
    drawPlan( id, planNum );
    return true;
}

function updateWall( id ) {
    var wallLength = getInputValue( "wallLength" + id );
    if( wallLength < 0 ) return;
    
    var minBoxWidth = getInputValue( "minBoxWidth" + id );
    if( minBoxWidth < 0 ) return;
    
    var maxBoxWidth = getInputValue( "maxBoxWidth" + id );
    if( maxBoxWidth < 0 ) return;
    if( maxBoxWidth < minBoxWidth ) {
        alert( "Error: Max Box Width < Min Box Width" );
        document.getElementById( "maxBoxWidth" + id ).focus();
        return;
    }
    
    var minStartDist = getInputValue( "minStartDist" + id );
    if( minStartDist < 0 ) return;
    
    var maxStartDist = getInputValue( "maxStartDist" + id );
    if( maxStartDist < 0 ) return;
    if( maxStartDist < minStartDist ) {
        alert( "Error: Max Start Dist < Min Start Dist" );
        document.getElementById( "maxStartDist" + id ).focus();
        return;
    }
    
    var boxDist = getInputValue( "boxDist" + id );
    if( boxDist < 0 ) return;
    
    var minEndDist = getInputValue( "minEndDist" + id );
    if( minEndDist < 0 ) return;
    
    var maxEndDist = getInputValue( "maxEndDist" + id );
    if( maxEndDist < 0 ) return;
    if( maxEndDist < minEndDist ) {
        alert( "Error: Max End Dist < Min End Dist" );
        document.getElementById( "maxEndDist" + id ).focus();
        return;
    }
    var sideWidth = getInputValue( "sideWidth" + id );
    if( sideWidth < 0 ) return;
    
    var boxHeight = getInputValue( "boxHeight" + id );
    if( boxHeight < 0 ) return;
    
    var obstacles = document.getElementById( "obstacles" + id ).value;
    var tbody = document.getElementById( "plan" + id );
    while( tbody.rows.length > 0 ) {
        tbody.deleteRow( 0 );
    }
    
    var planNum = 1;
    var startDist = minStartDist;
    while( startDist <= maxStartDist ) {
        var boxWidth = maxBoxWidth;
        while( boxWidth >= minBoxWidth ) {
            var boxNum = 1;
            var boxes = "";
            var boxEnd = startDist + boxWidth;
            var endDist = wallLength - boxEnd;
            while( endDist > maxEndDist ) {
                boxes += "B" + boxNum + "=[" + (boxEnd - boxWidth) + "|" + boxWidth + "] ";
                boxEnd += boxDist + boxWidth;
                endDist = wallLength - boxEnd;
                boxNum++;
            }
            if( endDist >= minEndDist && endDist <= maxEndDist ) {
                boxes += "B" + boxNum + "=[" + (boxEnd - boxWidth) + "|" + boxWidth + "] ";
                var params = "WL=" + wallLength + " SD=" + startDist + " BD=" + boxDist + 
                             " ED=" + endDist + " SW=" + sideWidth + " BH=" + boxHeight;
                
                if( addPlan( id, planNum, params, obstacles, boxes, sideWidth ) ) {
                    planNum++;
                }
            }
            boxWidth -= 0.125;
        }
        startDist += 0.125;
    }
}