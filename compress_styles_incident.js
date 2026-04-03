const fs = require('fs');

const files = [
    "c:\\New folder\\OREDA-Mobile\\src\\screens\\IncidentDetailScreen.tsx"
];

function compressNumber(prop, val) {
    if (val <= 2) return val;
    
    if (prop.includes('fontSize')) {
        return Math.max(10, val - 2);
    } else if (prop.match(/padding|margin|gap/i)) {
        return Math.max(2, Math.floor(val * 0.7));
    } else if (prop.match(/width|height|borderRadius/i)) {
        if (prop === 'width' && val === 100) return val; // skip width: '100%' if it was a number
        if (val > 24) return Math.max(10, Math.floor(val * 0.85));
        return val;
    }
    return val;
}

const pattern = /([A-Za-z]+)\s*:\s*(\d+)/g;

function processFile(filepath) {
    if (!fs.existsSync(filepath)) {
        console.log("File not found: " + filepath);
        return;
    }
    
    let content = fs.readFileSync(filepath, 'utf8');
    let stylesIdx = content.lastIndexOf("StyleSheet.create");
    
    if (stylesIdx === -1) {
        console.log("No StyleSheet found in " + filepath);
        return;
    }
    
    let preStyles = content.substring(0, stylesIdx);
    let postStyles = content.substring(stylesIdx);
    
    let compressedStyles = postStyles.replace(pattern, (match, prop, valStr) => {
        let val = parseInt(valStr, 10);
        if (['flex', 'zIndex', 'opacity', 'elevation', 'shadowOpacity', 'fontWeight'].includes(prop)) {
            return match;
        }
        let newVal = compressNumber(prop, val);
        return `${prop}: ${newVal}`;
    });
    
    fs.writeFileSync(filepath, preStyles + compressedStyles, 'utf8');
    console.log("Compressed: " + filepath);
}

files.forEach(processFile);
