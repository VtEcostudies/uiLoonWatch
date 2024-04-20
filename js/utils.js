
/*
  Fix eg. townName - remove semicolons, capitalize the first letter of each word
*/
export function capitalize(name) {
    name = name.replace(';','');
    let ta = name.split(' ');
    let tf = '';
    for (const tp of ta) {tf += tp[0].toUpperCase() + tp.substring(1).toLowerCase() + ' ';}
    name = tf.trim();
    return name;
  }
  