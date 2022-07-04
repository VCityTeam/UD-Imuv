/** @format */

const bbb = require("bigbluebutton-js");

const exec = require("child-process-promise").exec;
const fs = require("fs");
const parseString = require("xml2js").parseString;

const BBBWrapperModule = class BBBWrapper {
  constructor(config) {
    this.config = config;

    //or not bbb api
    if (config.ENV.BBB_URL && config.ENV.BBB_SECRET) {
      this.bbbAPI = bbb.api(config.ENV.BBB_URL, config.ENV.BBB_SECRET);
    } else {
      this.bbbAPI = null;
    }
  }

  hasBBBApi() {
    return !!this.bbbAPI;
  }

  queryBBBRooms() {
    const _this = this;
    return new Promise((resolve, reject) => {
      if (!_this.bbbAPI) {
        reject("queryRooms no bbb api");
        return;
      }

      const meetingsURL = _this.bbbAPI.monitoring.getMeetings();
      const pathTempXML = "./assets/temp/bbb_data.xml";

      try {
        exec("wget " + meetingsURL + " -O " + pathTempXML).then(function () {
          if (fs.existsSync(pathTempXML)) {
            //file exists
            fs.readFile(pathTempXML, "utf-8", function (err, data) {
              if (err) {
                throw new Error(err);
              }

              parseString(data, function (errParser, jsData) {
                const result = [];

                if (errParser) {
                  throw new Error(errParser);
                }

                if (!jsData.response) throw new Error("no response");

                if (jsData.response.returncode[0] != "SUCCESS")
                  throw new Error("response status is not SUCCESS");

                if (
                  jsData.response.messageKey &&
                  jsData.response.messageKey[0] == "noMeetings"
                ) {
                  console.warn("no bbb meetings alived");
                  resolve(result);
                  return;
                }

                const meetings = jsData.response.meetings;
                meetings[0].meeting.forEach(function (m) {
                  // api.administration.end(m.meetingID[0], m.moderatorPW[0]);
                  // console.log('end bbb meeting ', m.meetingID[0]);
                  result.push(new BBBRoom(m));
                });

                resolve(result);
              });
            });
          } else {
            reject("cant reach url meetings xml file");
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  endBBBRooms() {
    const api = this.bbbAPI;
    return new Promise((resolve, reject) => {
      if (!api) {
        resolve(); //nothing to end
        return;
      }

      this.queryBBBRooms()
        .then(function (rooms) {
          rooms.forEach(function (r) {
            r.end(api);
          });

          console.log("clean bbb rooms on the server");
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  createBBBRoom(uuid, name) {
    const api = this.bbbAPI;

    return new Promise((resolve, reject) => {
      if (!api) {
        reject("create rooms no bbb api");
        return;
      }

      name = name || "default_BBB_ROOM_Name";

      const mPw = "mpw";
      const aPw = "apw";

      const meetingCreateUrl = api.administration.create(name, uuid, {
        attendeePW: aPw,
        moderatorPW: mPw,
      });

      bbb
        .http(meetingCreateUrl)
        .then(() => {
          resolve({
            url: this.bbbAPI.administration.join("attendee", uuid, aPw),
            name: name,
            uuid: uuid,
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
};

module.exports = BBBWrapperModule;

class BBBRoom {
  constructor(params) {
    this.params = params;
  }

  end(api) {
    console.log("end ", this.params.meetingName[0], this.params.meetingID[0]);

    api.administration.end(
      this.params.meetingID[0],
      this.params.moderatorPW[0]
    );
  }
}
