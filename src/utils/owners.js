const path = require("path");
const { readJson, writeJson } = require("./storage");

const OWNERS_PATH = path.join(__dirname, "../../data/owners.json");

function getOwners() {
  const data = readJson(OWNERS_PATH, { owners: [] });
  data.owners = Array.isArray(data.owners) ? data.owners : [];
  return data;
}

function isOwner(userId) {
  const data = getOwners();
  return data.owners.includes(userId);
}

function addOwner(userId) {
  const data = getOwners();
  if (!data.owners.includes(userId)) data.owners.push(userId);
  writeJson(OWNERS_PATH, data);
  return data.owners;
}

function removeOwner(userId) {
  const data = getOwners();
  data.owners = data.owners.filter(id => id !== userId);
  writeJson(OWNERS_PATH, data);
  return data.owners;
}

module.exports = { getOwners, isOwner, addOwner, removeOwner };
