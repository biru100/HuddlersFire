// Packed from the user-selected camper motion sources. Check with npm run sprites:camper -- --check.
export const CAMPER_MOTION_RELEASE = {
  "version": 4,
  "sources": {
    "receipt": "48d95b3d361afc11367d19648a9ce78b44fd0a1a6151825c82b949d0949450fa",
    "base": {
      "field-camper-v2": "c94358ad19abcc7edf010240b309969a8c6b68e2e3ef8660c59dab79b89fa382",
      "field-camper-walk": "9104fd145a07333ed4aa26eb8750e5452008b6006e7952e9df62acc8bca801ac"
    }
  },
  "files": {
    "camper-motion-native-color": {
      "url": "/sprites/camper-motion-native-color.d2076b7dcd19.png",
      "sha256": "d2076b7dcd192e2fc021c35056d8fb838bf485fb7eca6b6fe39377740561225d",
      "bytes": 585041,
      "width": 1024,
      "height": 1600,
      "sampling": "nearest"
    },
    "camper-motion-native-normal": {
      "url": "/sprites/camper-motion-native-normal.55d21ca9cf31.png",
      "sha256": "55d21ca9cf31ba960680418c691b31caf6c9755771c55acd092191fff7451c25",
      "bytes": 549619,
      "width": 1024,
      "height": 1600,
      "sampling": "nearest"
    },
    "camper-motion-walk-normal": {
      "url": "/sprites/camper-motion-walk-normal.393db82899e8.png",
      "sha256": "393db82899e80b957966f58b273a003e02b42220b53d650a328729c5f2822a4a",
      "bytes": 547899,
      "width": 3072,
      "height": 960,
      "sampling": "linear"
    }
  },
  "motion": {
    "plates": {
      "native": {
        "density": 1,
        "color": "camper-motion-native-color",
        "normal": "camper-motion-native-normal"
      },
      "walk": {
        "density": 3,
        "color": "field-camper-walk",
        "normal": "camper-motion-walk-normal"
      }
    },
    "frames": {
      "idle.stand": [
        [
          {
            "plate": "native",
            "cell": [
              4,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          },
          {
            "plate": "native",
            "cell": [
              8,
              2
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              0,
              5
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              4,
              7
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              12,
              9
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              0,
              12
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              8,
              14
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          },
          {
            "plate": "native",
            "cell": [
              12,
              16
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          }
        ]
      ],
      "sit.hold": [
        [
          {
            "plate": "native",
            "cell": [
              5,
              0
            ],
            "anchor": 55,
            "neck": 38,
            "feet": 64,
            "waist": 52
          },
          {
            "plate": "native",
            "cell": [
              9,
              2
            ],
            "anchor": 55,
            "neck": 38,
            "feet": 64,
            "waist": 52
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              1,
              5
            ],
            "anchor": 55,
            "neck": 38,
            "feet": 62,
            "waist": 52
          },
          {
            "plate": "native",
            "cell": [
              5,
              7
            ],
            "anchor": 55,
            "neck": 38,
            "feet": 62,
            "waist": 52
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              13,
              9
            ],
            "anchor": 55,
            "neck": 38,
            "feet": 62,
            "waist": 52
          },
          {
            "plate": "native",
            "cell": [
              1,
              12
            ],
            "anchor": 55,
            "neck": 38,
            "feet": 62,
            "waist": 52
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              9,
              14
            ],
            "anchor": 55,
            "neck": 38,
            "feet": 64,
            "waist": 52
          },
          {
            "plate": "native",
            "cell": [
              13,
              16
            ],
            "anchor": 55,
            "neck": 38,
            "feet": 64,
            "waist": 52
          }
        ]
      ],
      "sit.enter": [
        [
          {
            "plate": "native",
            "cell": [
              6,
              0
            ],
            "anchor": 61,
            "neck": 35,
            "feet": 74,
            "foreground": true,
            "waist": 52
          },
          {
            "plate": "native",
            "cell": [
              10,
              2
            ],
            "anchor": 61,
            "neck": 35,
            "feet": 74,
            "foreground": true,
            "waist": 52
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              2,
              5
            ],
            "anchor": 61,
            "neck": 35,
            "feet": 72,
            "foreground": true,
            "waist": 52
          },
          {
            "plate": "native",
            "cell": [
              6,
              7
            ],
            "anchor": 61,
            "neck": 35,
            "feet": 72,
            "foreground": true,
            "waist": 52
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              14,
              9
            ],
            "anchor": 61,
            "neck": 35,
            "feet": 72,
            "foreground": true,
            "waist": 52
          },
          {
            "plate": "native",
            "cell": [
              2,
              12
            ],
            "anchor": 61,
            "neck": 35,
            "feet": 72,
            "foreground": true,
            "waist": 52
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              10,
              14
            ],
            "anchor": 61,
            "neck": 35,
            "feet": 74,
            "foreground": true,
            "waist": 52
          },
          {
            "plate": "native",
            "cell": [
              14,
              16
            ],
            "anchor": 61,
            "neck": 35,
            "feet": 74,
            "foreground": true,
            "waist": 52
          }
        ]
      ],
      "jump.prepare": [
        [
          {
            "plate": "native",
            "cell": [
              7,
              0
            ],
            "anchor": 71,
            "neck": 35,
            "feet": 71,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              11,
              2
            ],
            "anchor": 71,
            "neck": 35,
            "feet": 71,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              3,
              5
            ],
            "anchor": 69,
            "neck": 35,
            "feet": 69,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              7,
              7
            ],
            "anchor": 69,
            "neck": 35,
            "feet": 69,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              15,
              9
            ],
            "anchor": 69,
            "neck": 35,
            "feet": 69,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              3,
              12
            ],
            "anchor": 69,
            "neck": 35,
            "feet": 69,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              11,
              14
            ],
            "anchor": 71,
            "neck": 35,
            "feet": 71,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              15,
              16
            ],
            "anchor": 71,
            "neck": 35,
            "feet": 71,
            "foreground": false
          }
        ]
      ],
      "jump.rise": [
        [
          {
            "plate": "native",
            "cell": [
              8,
              0
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              12,
              2
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              4,
              5
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 67,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              8,
              7
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 67,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              0,
              10
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 67,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              4,
              12
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 67,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              12,
              14
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              0,
              17
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 69,
            "foreground": true
          }
        ]
      ],
      "jump.land": [
        [
          {
            "plate": "native",
            "cell": [
              9,
              0
            ],
            "anchor": 71,
            "neck": 36,
            "feet": 71,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              13,
              2
            ],
            "anchor": 71,
            "neck": 36,
            "feet": 71,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              5,
              5
            ],
            "anchor": 69,
            "neck": 36,
            "feet": 69,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              9,
              7
            ],
            "anchor": 69,
            "neck": 36,
            "feet": 69,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              1,
              10
            ],
            "anchor": 69,
            "neck": 36,
            "feet": 69,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              5,
              12
            ],
            "anchor": 69,
            "neck": 36,
            "feet": 69,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              13,
              14
            ],
            "anchor": 71,
            "neck": 36,
            "feet": 71,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              1,
              17
            ],
            "anchor": 71,
            "neck": 36,
            "feet": 71,
            "foreground": false
          }
        ]
      ],
      "carry.holder": [
        [
          {
            "plate": "native",
            "cell": [
              10,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              14,
              2
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              6,
              5
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              10,
              7
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              2,
              10
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              6,
              12
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              14,
              14
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              2,
              17
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": true
          }
        ]
      ],
      "throw.release": [
        [
          {
            "plate": "native",
            "cell": [
              11,
              0
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              15,
              2
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              7,
              5
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              11,
              7
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              3,
              10
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              7,
              12
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              15,
              14
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              3,
              17
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "foreground": true
          }
        ]
      ],
      "carry.passenger": [
        [
          {
            "plate": "native",
            "cell": [
              12,
              0
            ],
            "anchor": 71,
            "neck": 36,
            "feet": 66,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              0,
              3
            ],
            "anchor": 71,
            "neck": 36,
            "feet": 66,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              8,
              5
            ],
            "anchor": 69,
            "neck": 36,
            "feet": 64,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              12,
              7
            ],
            "anchor": 69,
            "neck": 36,
            "feet": 64,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              4,
              10
            ],
            "anchor": 69,
            "neck": 36,
            "feet": 64,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              8,
              12
            ],
            "anchor": 69,
            "neck": 36,
            "feet": 64,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              0,
              15
            ],
            "anchor": 71,
            "neck": 36,
            "feet": 66,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              4,
              17
            ],
            "anchor": 71,
            "neck": 36,
            "feet": 66,
            "foreground": true
          }
        ]
      ],
      "throw.passenger": [
        [
          {
            "plate": "native",
            "cell": [
              13,
              0
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 68,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              1,
              3
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 68,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              9,
              5
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 66,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              13,
              7
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 66,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              5,
              10
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 66,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              9,
              12
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 66,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              1,
              15
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 68,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              5,
              17
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 68,
            "foreground": true
          }
        ]
      ],
      "emote.wave": [
        [
          {
            "plate": "native",
            "cell": [
              14,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              2,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              10,
              5
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              14,
              7
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              6,
              10
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              10,
              12
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              2,
              15
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              6,
              17
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": true
          }
        ]
      ],
      "emote.heart": [
        [
          {
            "plate": "native",
            "cell": [
              15,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              3,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              11,
              5
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              15,
              7
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              7,
              10
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              11,
              12
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              3,
              15
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              7,
              17
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": false
          }
        ]
      ],
      "emote.clap": [
        [
          {
            "plate": "native",
            "cell": [
              0,
              1
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              4,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              12,
              5
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              0,
              8
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              8,
              10
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              12,
              12
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              4,
              15
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              8,
              17
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": false
          }
        ]
      ],
      "emote.dance": [
        [
          {
            "plate": "native",
            "cell": [
              1,
              1
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              5,
              3
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              13,
              5
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              1,
              8
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              9,
              10
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              13,
              12
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              5,
              15
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              9,
              17
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "foreground": true
          }
        ]
      ],
      "fall.edge": [
        [
          {
            "plate": "native",
            "cell": [
              2,
              1
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 67,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              6,
              3
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 67,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              14,
              5
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 65,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              2,
              8
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 65,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              10,
              10
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 65,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              14,
              12
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 65,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              6,
              15
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 67,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              10,
              17
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 67,
            "foreground": true
          }
        ]
      ],
      "hit.impact": [
        [
          {
            "plate": "native",
            "cell": [
              3,
              1
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              7,
              3
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              15,
              5
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              3,
              8
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              11,
              10
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              15,
              12
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              7,
              15
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              11,
              17
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "foreground": true
          }
        ]
      ],
      "weapon.gun-aim": [
        [
          {
            "plate": "native",
            "cell": [
              4,
              1
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              8,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              0,
              6
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              4,
              8
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              12,
              10
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              0,
              13
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              8,
              15
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              12,
              17
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": true
          }
        ]
      ],
      "weapon.snowball-aim": [
        [
          {
            "plate": "native",
            "cell": [
              5,
              1
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              9,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              1,
              6
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              5,
              8
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              13,
              10
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              1,
              13
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              9,
              15
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              13,
              17
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": false
          }
        ]
      ],
      "idle.inhale": [
        [
          {
            "plate": "native",
            "cell": [
              6,
              1
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71
          },
          {
            "plate": "native",
            "cell": [
              10,
              3
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              2,
              6
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              6,
              8
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              14,
              10
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              2,
              13
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              10,
              15
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71
          },
          {
            "plate": "native",
            "cell": [
              14,
              17
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71
          }
        ]
      ],
      "sit.exit": [
        [
          {
            "plate": "native",
            "cell": [
              7,
              1
            ],
            "anchor": 71,
            "neck": 32,
            "feet": 75,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              11,
              3
            ],
            "anchor": 71,
            "neck": 32,
            "feet": 75,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              3,
              6
            ],
            "anchor": 69,
            "neck": 32,
            "feet": 73,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              7,
              8
            ],
            "anchor": 69,
            "neck": 32,
            "feet": 73,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              15,
              10
            ],
            "anchor": 69,
            "neck": 32,
            "feet": 73,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              3,
              13
            ],
            "anchor": 69,
            "neck": 32,
            "feet": 73,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              11,
              15
            ],
            "anchor": 71,
            "neck": 32,
            "feet": 75,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              15,
              17
            ],
            "anchor": 71,
            "neck": 32,
            "feet": 75,
            "foreground": true
          }
        ]
      ],
      "crouch.hold": [
        [
          {
            "plate": "native",
            "cell": [
              8,
              1
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              12,
              3
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              4,
              6
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 69,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              8,
              8
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 69,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              0,
              11
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 69,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              4,
              13
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 69,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              12,
              15
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              0,
              18
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "foreground": false
          }
        ]
      ],
      "jump.fall": [
        [
          {
            "plate": "native",
            "cell": [
              9,
              1
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 67,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              13,
              3
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 67,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              5,
              6
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 65,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              9,
              8
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 65,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              1,
              11
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 65,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              5,
              13
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 65,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              13,
              15
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 67,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              1,
              18
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 67,
            "foreground": true
          }
        ]
      ],
      "weapon.gun-fire": [
        [
          {
            "plate": "native",
            "cell": [
              10,
              1
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              14,
              3
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              6,
              6
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              10,
              8
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              2,
              11
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              6,
              13
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              14,
              15
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              2,
              18
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "foreground": true
          }
        ]
      ],
      "weapon.bomb-aim": [
        [
          {
            "plate": "native",
            "cell": [
              11,
              1
            ],
            "anchor": 71,
            "neck": 42,
            "feet": 71,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              15,
              3
            ],
            "anchor": 71,
            "neck": 42,
            "feet": 71,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              7,
              6
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 69,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              11,
              8
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 69,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              3,
              11
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 69,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              7,
              13
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 69,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              15,
              15
            ],
            "anchor": 71,
            "neck": 42,
            "feet": 71,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              3,
              18
            ],
            "anchor": 71,
            "neck": 42,
            "feet": 71,
            "foreground": false
          }
        ]
      ],
      "weapon.snowball-throw": [
        [
          {
            "plate": "native",
            "cell": [
              12,
              1
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              0,
              4
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              8,
              6
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              12,
              8
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              4,
              11
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              8,
              13
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              0,
              16
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              4,
              18
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "foreground": true
          }
        ]
      ],
      "weapon.bomb-throw": [
        [
          {
            "plate": "native",
            "cell": [
              13,
              1
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              1,
              4
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              9,
              6
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              13,
              8
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              5,
              11
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              9,
              13
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              1,
              16
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              5,
              18
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "foreground": true
          }
        ]
      ],
      "emote.laugh": [
        [
          {
            "plate": "native",
            "cell": [
              14,
              1
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              2,
              4
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              10,
              6
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              14,
              8
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              6,
              11
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              10,
              13
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69,
            "foreground": false
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              2,
              16
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "foreground": false
          },
          {
            "plate": "native",
            "cell": [
              6,
              18
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "foreground": false
          }
        ]
      ],
      "emote.surprise": [
        [
          {
            "plate": "native",
            "cell": [
              15,
              1
            ],
            "anchor": 71,
            "neck": 35,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              3,
              4
            ],
            "anchor": 71,
            "neck": 35,
            "feet": 71,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              11,
              6
            ],
            "anchor": 69,
            "neck": 35,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              15,
              8
            ],
            "anchor": 69,
            "neck": 35,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              7,
              11
            ],
            "anchor": 69,
            "neck": 35,
            "feet": 69,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              11,
              13
            ],
            "anchor": 69,
            "neck": 35,
            "feet": 69,
            "foreground": true
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              3,
              16
            ],
            "anchor": 71,
            "neck": 35,
            "feet": 71,
            "foreground": true
          },
          {
            "plate": "native",
            "cell": [
              7,
              18
            ],
            "anchor": 71,
            "neck": 35,
            "feet": 71,
            "foreground": true
          }
        ]
      ],
      "walk.step-1": [
        [
          {
            "plate": "walk",
            "cell": [
              0,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          },
          {
            "plate": "walk",
            "cell": [
              8,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              0,
              1
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          },
          {
            "plate": "walk",
            "cell": [
              8,
              1
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              0,
              2
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          },
          {
            "plate": "walk",
            "cell": [
              8,
              2
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              0,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          },
          {
            "plate": "walk",
            "cell": [
              8,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          }
        ]
      ],
      "run.step-1": [
        [
          {
            "plate": "native",
            "cell": [
              0,
              2
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 70
          },
          {
            "plate": "native",
            "cell": [
              4,
              4
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 70
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              12,
              6
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 68
          },
          {
            "plate": "native",
            "cell": [
              0,
              9
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 68
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              8,
              11
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 68
          },
          {
            "plate": "native",
            "cell": [
              12,
              13
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 68
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              4,
              16
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 70
          },
          {
            "plate": "native",
            "cell": [
              8,
              18
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 70
          }
        ]
      ],
      "walk.step-2": [
        [
          {
            "plate": "walk",
            "cell": [
              1,
              0
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71
          },
          {
            "plate": "walk",
            "cell": [
              9,
              0
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              1,
              1
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69
          },
          {
            "plate": "walk",
            "cell": [
              9,
              1
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              1,
              2
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69
          },
          {
            "plate": "walk",
            "cell": [
              9,
              2
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              1,
              3
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71
          },
          {
            "plate": "walk",
            "cell": [
              9,
              3
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71
          }
        ]
      ],
      "run.step-2": [
        [
          {
            "plate": "native",
            "cell": [
              1,
              2
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          },
          {
            "plate": "native",
            "cell": [
              5,
              4
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              13,
              6
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              1,
              9
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              9,
              11
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              13,
              13
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              5,
              16
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          },
          {
            "plate": "native",
            "cell": [
              9,
              18
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          }
        ]
      ],
      "walk.step-3": [
        [
          {
            "plate": "walk",
            "cell": [
              2,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          },
          {
            "plate": "walk",
            "cell": [
              10,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              2,
              1
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          },
          {
            "plate": "walk",
            "cell": [
              10,
              1
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              2,
              2
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          },
          {
            "plate": "walk",
            "cell": [
              10,
              2
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              2,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          },
          {
            "plate": "walk",
            "cell": [
              10,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          }
        ]
      ],
      "run.step-3": [
        [
          {
            "plate": "native",
            "cell": [
              2,
              2
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71
          },
          {
            "plate": "native",
            "cell": [
              6,
              4
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              14,
              6
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              2,
              9
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              10,
              11
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              14,
              13
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              6,
              16
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71
          },
          {
            "plate": "native",
            "cell": [
              10,
              18
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71
          }
        ]
      ],
      "walk.step-4": [
        [
          {
            "plate": "walk",
            "cell": [
              3,
              0
            ],
            "anchor": 71,
            "neck": 39.333333333333336,
            "feet": 71
          },
          {
            "plate": "walk",
            "cell": [
              11,
              0
            ],
            "anchor": 71,
            "neck": 39.333333333333336,
            "feet": 71
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              3,
              1
            ],
            "anchor": 69,
            "neck": 39.333333333333336,
            "feet": 69
          },
          {
            "plate": "walk",
            "cell": [
              11,
              1
            ],
            "anchor": 69,
            "neck": 39.333333333333336,
            "feet": 69
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              3,
              2
            ],
            "anchor": 69,
            "neck": 39.333333333333336,
            "feet": 69
          },
          {
            "plate": "walk",
            "cell": [
              11,
              2
            ],
            "anchor": 69,
            "neck": 39.333333333333336,
            "feet": 69
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              3,
              3
            ],
            "anchor": 71,
            "neck": 39.333333333333336,
            "feet": 71
          },
          {
            "plate": "walk",
            "cell": [
              11,
              3
            ],
            "anchor": 71,
            "neck": 39.333333333333336,
            "feet": 71
          }
        ]
      ],
      "run.step-4": [
        [
          {
            "plate": "native",
            "cell": [
              3,
              2
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              7,
              4
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 69
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              15,
              6
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 67
          },
          {
            "plate": "native",
            "cell": [
              3,
              9
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 67
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              11,
              11
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 67
          },
          {
            "plate": "native",
            "cell": [
              15,
              13
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 67
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              7,
              16
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              11,
              18
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 69
          }
        ]
      ],
      "walk.step-5": [
        [
          {
            "plate": "walk",
            "cell": [
              4,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          },
          {
            "plate": "walk",
            "cell": [
              12,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              4,
              1
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          },
          {
            "plate": "walk",
            "cell": [
              12,
              1
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              4,
              2
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          },
          {
            "plate": "walk",
            "cell": [
              12,
              2
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              4,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          },
          {
            "plate": "walk",
            "cell": [
              12,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          }
        ]
      ],
      "run.step-5": [
        [
          {
            "plate": "native",
            "cell": [
              4,
              2
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 70
          },
          {
            "plate": "native",
            "cell": [
              8,
              4
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 70
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              0,
              7
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 68
          },
          {
            "plate": "native",
            "cell": [
              4,
              9
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 68
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              12,
              11
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 68
          },
          {
            "plate": "native",
            "cell": [
              0,
              14
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 68
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              8,
              16
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 70
          },
          {
            "plate": "native",
            "cell": [
              12,
              18
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 70
          }
        ]
      ],
      "walk.step-6": [
        [
          {
            "plate": "walk",
            "cell": [
              5,
              0
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71
          },
          {
            "plate": "walk",
            "cell": [
              13,
              0
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              5,
              1
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69
          },
          {
            "plate": "walk",
            "cell": [
              13,
              1
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              5,
              2
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69
          },
          {
            "plate": "walk",
            "cell": [
              13,
              2
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              5,
              3
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71
          },
          {
            "plate": "walk",
            "cell": [
              13,
              3
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71
          }
        ]
      ],
      "run.step-6": [
        [
          {
            "plate": "native",
            "cell": [
              5,
              2
            ],
            "anchor": 71,
            "neck": 42,
            "feet": 71
          },
          {
            "plate": "native",
            "cell": [
              9,
              4
            ],
            "anchor": 71,
            "neck": 42,
            "feet": 71
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              1,
              7
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              5,
              9
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 69
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              13,
              11
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              1,
              14
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 69
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              9,
              16
            ],
            "anchor": 71,
            "neck": 42,
            "feet": 71
          },
          {
            "plate": "native",
            "cell": [
              13,
              18
            ],
            "anchor": 71,
            "neck": 42,
            "feet": 71
          }
        ]
      ],
      "walk.step-7": [
        [
          {
            "plate": "walk",
            "cell": [
              6,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          },
          {
            "plate": "walk",
            "cell": [
              14,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              6,
              1
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          },
          {
            "plate": "walk",
            "cell": [
              14,
              1
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              6,
              2
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          },
          {
            "plate": "walk",
            "cell": [
              14,
              2
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              6,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          },
          {
            "plate": "walk",
            "cell": [
              14,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          }
        ]
      ],
      "run.step-7": [
        [
          {
            "plate": "native",
            "cell": [
              6,
              2
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71
          },
          {
            "plate": "native",
            "cell": [
              10,
              4
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              2,
              7
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              6,
              9
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              14,
              11
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              2,
              14
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              10,
              16
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71
          },
          {
            "plate": "native",
            "cell": [
              14,
              18
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71
          }
        ]
      ],
      "walk.step-8": [
        [
          {
            "plate": "walk",
            "cell": [
              7,
              0
            ],
            "anchor": 71,
            "neck": 39.333333333333336,
            "feet": 71
          },
          {
            "plate": "walk",
            "cell": [
              15,
              0
            ],
            "anchor": 71,
            "neck": 39.333333333333336,
            "feet": 71
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              7,
              1
            ],
            "anchor": 69,
            "neck": 39.333333333333336,
            "feet": 69
          },
          {
            "plate": "walk",
            "cell": [
              15,
              1
            ],
            "anchor": 69,
            "neck": 39.333333333333336,
            "feet": 69
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              7,
              2
            ],
            "anchor": 69,
            "neck": 39.333333333333336,
            "feet": 69
          },
          {
            "plate": "walk",
            "cell": [
              15,
              2
            ],
            "anchor": 69,
            "neck": 39.333333333333336,
            "feet": 69
          }
        ],
        [
          {
            "plate": "walk",
            "cell": [
              7,
              3
            ],
            "anchor": 71,
            "neck": 39.333333333333336,
            "feet": 71
          },
          {
            "plate": "walk",
            "cell": [
              15,
              3
            ],
            "anchor": 71,
            "neck": 39.333333333333336,
            "feet": 71
          }
        ]
      ],
      "run.step-8": [
        [
          {
            "plate": "native",
            "cell": [
              7,
              2
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              11,
              4
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 69
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              3,
              7
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 67
          },
          {
            "plate": "native",
            "cell": [
              7,
              9
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 67
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              15,
              11
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 67
          },
          {
            "plate": "native",
            "cell": [
              3,
              14
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 67
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              11,
              16
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              15,
              18
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 69
          }
        ]
      ],
      "idle.blink": [
        [
          {
            "plate": "native",
            "cell": [
              4,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          },
          {
            "plate": "native",
            "cell": [
              8,
              2
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              0,
              5
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              4,
              7
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              12,
              9
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          },
          {
            "plate": "native",
            "cell": [
              0,
              12
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69
          }
        ],
        [
          {
            "plate": "native",
            "cell": [
              8,
              14
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          },
          {
            "plate": "native",
            "cell": [
              12,
              16
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71
          }
        ]
      ]
    },
    "heads": [
      {
        "face": {
          "plate": "native",
          "cell": [
            0,
            0
          ]
        },
        "blink": {
          "plate": "native",
          "cell": [
            1,
            0
          ]
        },
        "hairs": [
          {
            "plate": "native",
            "cell": [
              2,
              0
            ]
          },
          {
            "plate": "native",
            "cell": [
              3,
              0
            ]
          }
        ]
      },
      {
        "face": {
          "plate": "native",
          "cell": [
            12,
            4
          ]
        },
        "blink": {
          "plate": "native",
          "cell": [
            13,
            4
          ]
        },
        "hairs": [
          {
            "plate": "native",
            "cell": [
              14,
              4
            ]
          },
          {
            "plate": "native",
            "cell": [
              15,
              4
            ]
          }
        ]
      },
      {
        "face": {
          "plate": "native",
          "cell": [
            8,
            9
          ]
        },
        "blink": {
          "plate": "native",
          "cell": [
            9,
            9
          ]
        },
        "hairs": [
          {
            "plate": "native",
            "cell": [
              10,
              9
            ]
          },
          {
            "plate": "native",
            "cell": [
              11,
              9
            ]
          }
        ]
      },
      {
        "face": {
          "plate": "native",
          "cell": [
            4,
            14
          ]
        },
        "blink": {
          "plate": "native",
          "cell": [
            5,
            14
          ]
        },
        "hairs": [
          {
            "plate": "native",
            "cell": [
              6,
              14
            ]
          },
          {
            "plate": "native",
            "cell": [
              7,
              14
            ]
          }
        ]
      }
    ]
  },
  "id": "4c9de38c96454e0ab5a94df5ad59e5d0f5d60c9b0d2447bc2b535b8429585b83"
};
