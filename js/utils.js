
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
  
/* this one is better, and written later, so prolly replace the other with this  
export function capitalize(string) {
  return string.split(' ').map(token => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()).join(' ');
}
*/
export function lowerAlphaNumeric(string) {
  return string.replace(/[.,\/#!$%\^&*;:{}=\-_`~()\?'"]/g, "").replace(/\s+/g, " ").toLowerCase();
}
