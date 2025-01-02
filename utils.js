// Copyright (C) 2024  xxpasixx

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

module.exports = {
  getRelativeValue: getRelativeValue,
  mapValue: mapValue,
  stringToAsciiHex: stringToAsciiHex,
  numberIntoHex: numberIntoHex,
};

function getRelativeValue(value, posFrom, posTo, negFrom, negTo) {
  if (value >= posFrom && value <= posTo) {
    return value - posFrom + 1;
  }
  if (value >= negFrom && value <= negTo) {
    return (negTo - value + 1) * -1;
  }
}

function mapValue(value, fromLow, fromHigh, toLow, toHigh) {
  const percent = (value - fromLow) / (fromHigh - fromLow);
  const result = percent * (toHigh - toLow) + toLow;
  return Math.min(Math.max(result, toLow), toHigh);
}

function stringToAsciiHex(str) {
  let hexString = "";
  for (let i = 0; i < str.length; i++) {
    const asciiValue = str.charCodeAt(i);
    const hexValue = asciiValue.toString(16).padStart(2, "0");
    hexString += hexValue + " ";
  }
  return hexString;
}

function numberIntoHex(nr) {
  return nr.toString(16).padStart(2, "0");
}
