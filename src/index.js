const fs = require("fs");
const SmarterBuffer = require("./smarter-buffer");

const Encounter = require("./encounter");
const AgentFactory = require("./agent/factory");
const SkillFactory = require("./skill/factory");
const CombatEventFactory = require("./combat-event/factory");

const request = require("request").defaults({ encoding: null });

const AdmZip = require("adm-zip");

async function parse(buffer) {
  const logBuffer = SmarterBuffer.fromBuffer(buffer);

  const encounter = new Encounter(logBuffer);

  return encounter;
  const skillCount = logBuffer.readUIntLE(4);

  for (let i = 0; i < skillCount; i++) {
    SkillFactory.create({
      skillId: logBuffer.readUIntLE(4),
      name: logBuffer.readString(64)
    })
      .then(skill => {
        // do something
      })
      .catch(err => console.log(err));
  }

  while (logBuffer.remaining() >= 68) {
    CombatEventFactory.create({
      time: logBuffer.readUIntLE(8),
      srcAgent: logBuffer.readUIntLE(8),
      dstAgent: logBuffer.readUIntLE(8),
      value: logBuffer.readUIntLE(4),
      buffDamage: logBuffer.readUIntLE(4),
      overstackValue: logBuffer.readUIntLE(2),
      skillId: logBuffer.readUIntLE(2),
      srcInstId: logBuffer.readUIntLE(2),
      dstInstId: logBuffer.readUIntLE(2),
      srcMasterInstId: logBuffer.readUIntLE(2),
      iff: (function() {
        logBuffer.skip(9);
        return logBuffer.readUIntLE(1);
      })(),
      buff: logBuffer.readUIntLE(1),
      result: logBuffer.readUIntLE(1),
      isActivation: logBuffer.readUIntLE(1),
      isBuffRemove: logBuffer.readUIntLE(1),
      isNinety: logBuffer.readUIntLE(1),
      isFifty: logBuffer.readUIntLE(1),
      isMoving: logBuffer.readUIntLE(1),
      isStateChange: logBuffer.readUIntLE(1),
      isFlanking: logBuffer.readUIntLE(1)
    })
      .then(combatEvent => {
        //        console.log(combatEvent.constructor.name);
      })
      .catch(err => console.log(err));

    logBuffer.skip(3);
  }
}

async function fromZip(buffer) {
  const zip = new AdmZip(buffer);
  const zipEntries = zip.getEntries();

  return zipEntries[0].getData();
}

export async function fromUrl(url) {
  return new Promise(resolve => {
    request.get(url, async (err, res, body) => {
      resolve(
        fromZip(body).then(async buffer => {
          return parse(buffer);
        })
      );
    });
  });
}

export async function fromFile(filename) {
  return new Promise(resolve => {
    fs.readFile(filename, async (err, data) => {
      if (err) throw err;

      resolve(
        fromZip(data).then(async buffer => {
          return parse(buffer);
        })
      );
    });
  });
}
