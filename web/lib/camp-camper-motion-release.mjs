// Packed from the user-selected camper motion sources. Check with npm run sprites:camper -- --check.
export const CAMPER_MOTION_RELEASE = {
  "version": 4,
  "sources": {
    "receipt": "48d95b3d361afc11367d19648a9ce78b44fd0a1a6151825c82b949d0949450fa",
    "base": {
      "field-camper-v2": "c94358ad19abcc7edf010240b309969a8c6b68e2e3ef8660c59dab79b89fa382",
      "field-camper-walk": "9104fd145a07333ed4aa26eb8750e5452008b6006e7952e9df62acc8bca801ac"
    },
    "layout": "7790e0603ea1f210f6d7b5eea399f25ef0d963fb8a1ff71e850f8b7daaf3d08b",
    "collars": "86776890a4d8a32a7ce511c1c53cad065652799aa78a33964164692daa0bd63d"
  },
  "files": {
    "camper-motion-native-color": {
      "url": "/sprites/camper-motion-native-color.35d12c1ad5d0.png",
      "sha256": "35d12c1ad5d03a74b23d904d201b40adf5a63184e3d00c2daaef012bff5c2b21",
      "bytes": 607826,
      "width": 1024,
      "height": 1600,
      "sampling": "nearest"
    },
    "camper-motion-native-normal": {
      "url": "/sprites/camper-motion-native-normal.3f0987d28025.png",
      "sha256": "3f0987d280251f0edeac82e67ba4722a0ea6108b0639dfaa580220b772820781",
      "bytes": 563608,
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
            "feet": 71,
            "waist": 57,
            "join": [
              22,
              32
            ]
          },
          {
            "plate": "native",
            "cell": [
              8,
              2
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "waist": 57,
            "join": [
              23,
              44
            ]
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
            "feet": 69,
            "waist": 55,
            "join": [
              21,
              40
            ]
          },
          {
            "plate": "native",
            "cell": [
              4,
              7
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "waist": 56,
            "join": [
              31,
              41
            ]
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
            "feet": 69,
            "waist": 56,
            "join": [
              24,
              43
            ]
          },
          {
            "plate": "native",
            "cell": [
              0,
              12
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "waist": 56,
            "join": [
              25,
              35
            ]
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
            "feet": 71,
            "waist": 57,
            "join": [
              23,
              43
            ]
          },
          {
            "plate": "native",
            "cell": [
              12,
              16
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "waist": 57,
            "join": [
              23,
              43
            ]
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
            "waist": 52,
            "join": [
              22,
              47
            ]
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
            "waist": 52,
            "join": [
              21,
              46
            ]
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
            "waist": 52,
            "join": [
              26,
              45
            ]
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
            "waist": 52,
            "join": [
              28,
              47
            ]
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
            "waist": 52,
            "join": [
              22,
              40
            ]
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
            "waist": 52,
            "join": [
              22,
              40
            ]
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
            "waist": 52,
            "join": [
              20,
              44
            ]
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
            "waist": 52,
            "join": [
              19,
              43
            ]
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
            "neck": 40,
            "feet": 74,
            "foreground": true,
            "waist": 52,
            "join": [
              16,
              40
            ]
          },
          {
            "plate": "native",
            "cell": [
              10,
              2
            ],
            "anchor": 61,
            "neck": 40,
            "feet": 74,
            "foreground": true,
            "waist": 52,
            "join": [
              16,
              42
            ]
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
            "neck": 43,
            "feet": 72,
            "foreground": true,
            "waist": 52,
            "join": [
              15,
              40
            ]
          },
          {
            "plate": "native",
            "cell": [
              6,
              7
            ],
            "anchor": 61,
            "neck": 44,
            "feet": 72,
            "foreground": true,
            "waist": 52,
            "join": [
              14,
              39
            ]
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
            "neck": 44,
            "feet": 72,
            "foreground": true,
            "waist": 52,
            "join": [
              24,
              49
            ]
          },
          {
            "plate": "native",
            "cell": [
              2,
              12
            ],
            "anchor": 61,
            "neck": 45,
            "feet": 72,
            "foreground": true,
            "waist": 52,
            "join": [
              25,
              50
            ]
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
            "neck": 39,
            "feet": 74,
            "foreground": true,
            "waist": 52,
            "join": [
              24,
              49
            ]
          },
          {
            "plate": "native",
            "cell": [
              14,
              16
            ],
            "anchor": 61,
            "neck": 39,
            "feet": 74,
            "foreground": true,
            "waist": 52,
            "join": [
              23,
              49
            ]
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
            "neck": 38,
            "feet": 71,
            "foreground": false,
            "waist": 56,
            "join": [
              16,
              37
            ]
          },
          {
            "plate": "native",
            "cell": [
              11,
              2
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "foreground": false,
            "waist": 56,
            "join": [
              12,
              38
            ]
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
            "foreground": false,
            "waist": 54,
            "join": [
              15,
              36
            ]
          },
          {
            "plate": "native",
            "cell": [
              7,
              7
            ],
            "anchor": 69,
            "neck": 32,
            "feet": 69,
            "foreground": false,
            "waist": 52,
            "join": [
              9,
              37
            ]
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
            "neck": 36,
            "feet": 69,
            "foreground": false,
            "waist": 54,
            "join": [
              29,
              50
            ]
          },
          {
            "plate": "native",
            "cell": [
              3,
              12
            ],
            "anchor": 69,
            "neck": 33,
            "feet": 69,
            "foreground": false,
            "waist": 53,
            "join": [
              27,
              55
            ]
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
            "neck": 36,
            "feet": 71,
            "foreground": false,
            "waist": 55,
            "join": [
              28,
              50
            ]
          },
          {
            "plate": "native",
            "cell": [
              15,
              16
            ],
            "anchor": 71,
            "neck": 37,
            "feet": 71,
            "foreground": false,
            "waist": 56,
            "join": [
              26,
              52
            ]
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
            "foreground": true,
            "waist": 56,
            "join": [
              20,
              36
            ]
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
            "foreground": true,
            "waist": 56,
            "join": [
              17,
              32
            ]
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
            "neck": 40,
            "feet": 67,
            "foreground": true,
            "waist": 55,
            "join": [
              23,
              41
            ]
          },
          {
            "plate": "native",
            "cell": [
              8,
              7
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 67,
            "foreground": true,
            "waist": 55,
            "join": [
              33,
              47
            ]
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
            "neck": 40,
            "feet": 67,
            "foreground": true,
            "waist": 55,
            "join": [
              18,
              31
            ]
          },
          {
            "plate": "native",
            "cell": [
              4,
              12
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 67,
            "foreground": true,
            "waist": 55,
            "join": [
              19,
              33
            ]
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
            "neck": 37,
            "feet": 69,
            "foreground": true,
            "waist": 55,
            "join": [
              30,
              46
            ]
          },
          {
            "plate": "native",
            "cell": [
              0,
              17
            ],
            "anchor": 71,
            "neck": 37,
            "feet": 69,
            "foreground": true,
            "waist": 55,
            "join": [
              32,
              47
            ]
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
            "neck": 40,
            "feet": 71,
            "foreground": false,
            "waist": 57,
            "join": [
              33,
              43
            ]
          },
          {
            "plate": "native",
            "cell": [
              13,
              2
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": false,
            "waist": 57,
            "join": [
              13,
              42
            ]
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
            "neck": 39,
            "feet": 69,
            "foreground": false,
            "waist": 56,
            "join": [
              30,
              44
            ]
          },
          {
            "plate": "native",
            "cell": [
              9,
              7
            ],
            "anchor": 69,
            "neck": 37,
            "feet": 69,
            "foreground": false,
            "waist": 55,
            "join": [
              12,
              42
            ]
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
            "neck": 38,
            "feet": 69,
            "foreground": false,
            "waist": 55,
            "join": [
              22,
              51
            ]
          },
          {
            "plate": "native",
            "cell": [
              5,
              12
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 69,
            "foreground": false,
            "waist": 55,
            "join": [
              24,
              53
            ]
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
            "neck": 39,
            "feet": 71,
            "foreground": false,
            "waist": 57,
            "join": [
              21,
              31
            ]
          },
          {
            "plate": "native",
            "cell": [
              1,
              17
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "foreground": false,
            "waist": 57,
            "join": [
              23,
              52
            ]
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
            "neck": 38,
            "feet": 71,
            "foreground": true,
            "waist": 56,
            "join": [
              25,
              44
            ]
          },
          {
            "plate": "native",
            "cell": [
              14,
              2
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "foreground": true,
            "waist": 56,
            "join": [
              21,
              44
            ]
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
            "neck": 43,
            "feet": 69,
            "foreground": true,
            "waist": 57,
            "join": [
              22,
              44
            ]
          },
          {
            "plate": "native",
            "cell": [
              10,
              7
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 69,
            "foreground": true,
            "waist": 57,
            "join": [
              20,
              43
            ]
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
            "neck": 45,
            "feet": 69,
            "foreground": true,
            "waist": 58,
            "join": [
              21,
              42
            ]
          },
          {
            "plate": "native",
            "cell": [
              6,
              12
            ],
            "anchor": 69,
            "neck": 44,
            "feet": 69,
            "foreground": true,
            "waist": 58,
            "join": [
              22,
              44
            ]
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
            "neck": 38,
            "feet": 71,
            "foreground": true,
            "waist": 56,
            "join": [
              21,
              41
            ]
          },
          {
            "plate": "native",
            "cell": [
              2,
              17
            ],
            "anchor": 71,
            "neck": 37,
            "feet": 71,
            "foreground": true,
            "waist": 56,
            "join": [
              20,
              43
            ]
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
            "neck": 35,
            "feet": 71,
            "foreground": true,
            "waist": 55,
            "join": [
              22,
              35
            ]
          },
          {
            "plate": "native",
            "cell": [
              15,
              2
            ],
            "anchor": 71,
            "neck": 35,
            "feet": 71,
            "foreground": true,
            "waist": 55,
            "join": [
              23,
              36
            ]
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
            "neck": 40,
            "feet": 69,
            "foreground": true,
            "waist": 56,
            "join": [
              20,
              31
            ]
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
            "foreground": true,
            "waist": 56,
            "join": [
              20,
              31
            ]
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
            "foreground": true,
            "waist": 56,
            "join": [
              33,
              45
            ]
          },
          {
            "plate": "native",
            "cell": [
              7,
              12
            ],
            "anchor": 69,
            "neck": 37,
            "feet": 69,
            "foreground": true,
            "waist": 55,
            "join": [
              33,
              45
            ]
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
            "neck": 34,
            "feet": 71,
            "foreground": true,
            "waist": 54,
            "join": [
              29,
              42
            ]
          },
          {
            "plate": "native",
            "cell": [
              3,
              17
            ],
            "anchor": 71,
            "neck": 34,
            "feet": 71,
            "foreground": true,
            "waist": 54,
            "join": [
              27,
              40
            ]
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
            "neck": 35,
            "feet": 66,
            "foreground": true,
            "waist": 52,
            "join": [
              16,
              51
            ]
          },
          {
            "plate": "native",
            "cell": [
              0,
              3
            ],
            "anchor": 71,
            "neck": 34,
            "feet": 66,
            "foreground": true,
            "waist": 52,
            "join": [
              13,
              51
            ]
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
            "neck": 39,
            "feet": 64,
            "foreground": true,
            "waist": 53,
            "join": [
              15,
              50
            ]
          },
          {
            "plate": "native",
            "cell": [
              12,
              7
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 64,
            "foreground": true,
            "waist": 52,
            "join": [
              10,
              50
            ]
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
            "neck": 39,
            "feet": 64,
            "foreground": true,
            "waist": 53,
            "join": [
              14,
              49
            ]
          },
          {
            "plate": "native",
            "cell": [
              8,
              12
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 64,
            "foreground": true,
            "waist": 52,
            "join": [
              14,
              54
            ]
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
            "neck": 35,
            "feet": 66,
            "foreground": true,
            "waist": 52,
            "join": [
              13,
              49
            ]
          },
          {
            "plate": "native",
            "cell": [
              4,
              17
            ],
            "anchor": 71,
            "neck": 34,
            "feet": 66,
            "foreground": true,
            "waist": 52,
            "join": [
              12,
              51
            ]
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
            "neck": 36,
            "feet": 68,
            "foreground": true,
            "waist": 54,
            "join": [
              33,
              45
            ]
          },
          {
            "plate": "native",
            "cell": [
              1,
              3
            ],
            "anchor": 71,
            "neck": 37,
            "feet": 68,
            "foreground": true,
            "waist": 54,
            "join": [
              30,
              41
            ]
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
            "neck": 39,
            "feet": 66,
            "foreground": true,
            "waist": 54,
            "join": [
              30,
              45
            ]
          },
          {
            "plate": "native",
            "cell": [
              13,
              7
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 66,
            "foreground": true,
            "waist": 54,
            "join": [
              28,
              43
            ]
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
            "neck": 41,
            "feet": 66,
            "foreground": true,
            "waist": 55,
            "join": [
              20,
              33
            ]
          },
          {
            "plate": "native",
            "cell": [
              9,
              12
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 66,
            "foreground": true,
            "waist": 53,
            "join": [
              18,
              31
            ]
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
            "neck": 37,
            "feet": 68,
            "foreground": true,
            "waist": 51,
            "join": [
              19,
              32
            ]
          },
          {
            "plate": "native",
            "cell": [
              5,
              17
            ],
            "anchor": 71,
            "neck": 36,
            "feet": 68,
            "foreground": true,
            "waist": 54,
            "join": [
              23,
              41
            ]
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
            "neck": 41,
            "feet": 71,
            "foreground": true,
            "waist": 58,
            "join": [
              22,
              43
            ]
          },
          {
            "plate": "native",
            "cell": [
              2,
              3
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "foreground": true,
            "waist": 58,
            "join": [
              22,
              44
            ]
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
            "neck": 44,
            "feet": 69,
            "foreground": true,
            "waist": 58,
            "join": [
              21,
              41
            ]
          },
          {
            "plate": "native",
            "cell": [
              14,
              7
            ],
            "anchor": 69,
            "neck": 45,
            "feet": 69,
            "foreground": true,
            "waist": 58,
            "join": [
              21,
              42
            ]
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
            "neck": 45,
            "feet": 69,
            "foreground": true,
            "waist": 58,
            "join": [
              21,
              41
            ]
          },
          {
            "plate": "native",
            "cell": [
              10,
              12
            ],
            "anchor": 69,
            "neck": 46,
            "feet": 69,
            "foreground": true,
            "waist": 59,
            "join": [
              22,
              44
            ]
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
            "foreground": true,
            "waist": 57,
            "join": [
              21,
              42
            ]
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
            "foreground": true,
            "waist": 57,
            "join": [
              23,
              43
            ]
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
            "neck": 39,
            "feet": 71,
            "foreground": false,
            "waist": 57,
            "join": [
              22,
              42
            ]
          },
          {
            "plate": "native",
            "cell": [
              3,
              3
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "foreground": false,
            "waist": 56,
            "join": [
              24,
              44
            ]
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
            "neck": 39,
            "feet": 69,
            "foreground": false,
            "waist": 56,
            "join": [
              22,
              41
            ]
          },
          {
            "plate": "native",
            "cell": [
              15,
              7
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 69,
            "foreground": false,
            "waist": 57,
            "join": [
              22,
              43
            ]
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
            "foreground": false,
            "waist": 56,
            "join": [
              22,
              40
            ]
          },
          {
            "plate": "native",
            "cell": [
              11,
              12
            ],
            "anchor": 69,
            "neck": 43,
            "feet": 69,
            "foreground": false,
            "waist": 57,
            "join": [
              22,
              43
            ]
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
            "neck": 37,
            "feet": 71,
            "foreground": false,
            "waist": 56,
            "join": [
              22,
              41
            ]
          },
          {
            "plate": "native",
            "cell": [
              7,
              17
            ],
            "anchor": 71,
            "neck": 37,
            "feet": 71,
            "foreground": false,
            "waist": 56,
            "join": [
              23,
              42
            ]
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
            "neck": 38,
            "feet": 71,
            "foreground": false,
            "waist": 56,
            "join": [
              22,
              41
            ]
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
            "foreground": false,
            "waist": 57,
            "join": [
              24,
              42
            ]
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
            "neck": 39,
            "feet": 69,
            "foreground": false,
            "waist": 56,
            "join": [
              22,
              41
            ]
          },
          {
            "plate": "native",
            "cell": [
              0,
              8
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 69,
            "foreground": false,
            "waist": 57,
            "join": [
              23,
              43
            ]
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
            "neck": 39,
            "feet": 69,
            "foreground": false,
            "waist": 56,
            "join": [
              24,
              42
            ]
          },
          {
            "plate": "native",
            "cell": [
              12,
              12
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 69,
            "foreground": false,
            "waist": 57,
            "join": [
              22,
              43
            ]
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
            "neck": 37,
            "feet": 71,
            "foreground": false,
            "waist": 56,
            "join": [
              22,
              41
            ]
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
            "foreground": false,
            "waist": 57,
            "join": [
              23,
              41
            ]
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
            "neck": 40,
            "feet": 71,
            "foreground": true,
            "waist": 57,
            "join": [
              27,
              37
            ]
          },
          {
            "plate": "native",
            "cell": [
              5,
              3
            ],
            "anchor": 71,
            "neck": 42,
            "feet": 71,
            "foreground": true,
            "waist": 58,
            "join": [
              25,
              36
            ]
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
            "neck": 43,
            "feet": 69,
            "foreground": true,
            "waist": 57,
            "join": [
              26,
              36
            ]
          },
          {
            "plate": "native",
            "cell": [
              1,
              8
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 69,
            "foreground": true,
            "waist": 57,
            "join": [
              23,
              34
            ]
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
            "neck": 41,
            "feet": 69,
            "foreground": true,
            "waist": 56,
            "join": [
              30,
              41
            ]
          },
          {
            "plate": "native",
            "cell": [
              13,
              12
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 69,
            "foreground": true,
            "waist": 57,
            "join": [
              29,
              40
            ]
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
            "neck": 40,
            "feet": 71,
            "foreground": true,
            "waist": 57,
            "join": [
              29,
              40
            ]
          },
          {
            "plate": "native",
            "cell": [
              9,
              17
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "foreground": true,
            "waist": 58,
            "join": [
              29,
              39
            ]
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
            "foreground": true,
            "waist": 52,
            "join": [
              31,
              41
            ]
          },
          {
            "plate": "native",
            "cell": [
              6,
              3
            ],
            "anchor": 71,
            "neck": 37,
            "feet": 67,
            "foreground": true,
            "waist": 53,
            "join": [
              32,
              56
            ]
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
            "neck": 40,
            "feet": 65,
            "foreground": true,
            "waist": 54,
            "join": [
              27,
              37
            ]
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
            "foreground": true,
            "waist": 51,
            "join": [
              29,
              54
            ]
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
            "neck": 41,
            "feet": 65,
            "foreground": true,
            "waist": 54,
            "join": [
              25,
              35
            ]
          },
          {
            "plate": "native",
            "cell": [
              14,
              12
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 65,
            "foreground": true,
            "waist": 51,
            "join": [
              25,
              35
            ]
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
            "neck": 37,
            "feet": 67,
            "foreground": true,
            "waist": 51,
            "join": [
              3,
              31
            ]
          },
          {
            "plate": "native",
            "cell": [
              10,
              17
            ],
            "anchor": 71,
            "neck": 36,
            "feet": 67,
            "foreground": true,
            "waist": 53,
            "join": [
              7,
              32
            ]
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
            "neck": 36,
            "feet": 71,
            "foreground": true,
            "waist": 55,
            "join": [
              33,
              53
            ]
          },
          {
            "plate": "native",
            "cell": [
              7,
              3
            ],
            "anchor": 71,
            "neck": 35,
            "feet": 71,
            "foreground": true,
            "waist": 55,
            "join": [
              32,
              53
            ]
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
            "foreground": true,
            "waist": 55,
            "join": [
              30,
              50
            ]
          },
          {
            "plate": "native",
            "cell": [
              3,
              8
            ],
            "anchor": 69,
            "neck": 35,
            "feet": 69,
            "foreground": true,
            "waist": 54,
            "join": [
              30,
              50
            ]
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
            "foreground": true,
            "waist": 55,
            "join": [
              12,
              34
            ]
          },
          {
            "plate": "native",
            "cell": [
              15,
              12
            ],
            "anchor": 69,
            "neck": 37,
            "feet": 69,
            "foreground": true,
            "waist": 55,
            "join": [
              15,
              35
            ]
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
            "neck": 35,
            "feet": 71,
            "foreground": true,
            "waist": 55,
            "join": [
              22,
              32
            ]
          },
          {
            "plate": "native",
            "cell": [
              11,
              17
            ],
            "anchor": 71,
            "neck": 36,
            "feet": 71,
            "foreground": true,
            "waist": 55,
            "join": [
              11,
              32
            ]
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
            "neck": 42,
            "feet": 71,
            "foreground": true,
            "waist": 58,
            "join": [
              23,
              44
            ]
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
            "foreground": true,
            "waist": 57,
            "join": [
              24,
              44
            ]
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
            "neck": 43,
            "feet": 69,
            "foreground": true,
            "waist": 57,
            "join": [
              25,
              45
            ]
          },
          {
            "plate": "native",
            "cell": [
              4,
              8
            ],
            "anchor": 69,
            "neck": 43,
            "feet": 69,
            "foreground": true,
            "waist": 57,
            "join": [
              23,
              44
            ]
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
            "neck": 44,
            "feet": 69,
            "foreground": true,
            "waist": 58,
            "join": [
              21,
              32
            ]
          },
          {
            "plate": "native",
            "cell": [
              0,
              13
            ],
            "anchor": 69,
            "neck": 44,
            "feet": 69,
            "foreground": true,
            "waist": 58,
            "join": [
              21,
              41
            ]
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
            "foreground": true,
            "waist": 57,
            "join": [
              19,
              40
            ]
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
            "foreground": true,
            "waist": 57,
            "join": [
              20,
              40
            ]
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
            "neck": 36,
            "feet": 71,
            "foreground": false,
            "waist": 55,
            "join": [
              27,
              45
            ]
          },
          {
            "plate": "native",
            "cell": [
              9,
              3
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "foreground": false,
            "waist": 57,
            "join": [
              23,
              45
            ]
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
            "foreground": false,
            "waist": 56,
            "join": [
              24,
              43
            ]
          },
          {
            "plate": "native",
            "cell": [
              5,
              8
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "foreground": false,
            "waist": 56,
            "join": [
              22,
              44
            ]
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
            "neck": 41,
            "feet": 69,
            "foreground": false,
            "waist": 56,
            "join": [
              22,
              41
            ]
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
            "foreground": false,
            "waist": 56,
            "join": [
              20,
              42
            ]
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
            "neck": 36,
            "feet": 71,
            "foreground": false,
            "waist": 55,
            "join": [
              19,
              38
            ]
          },
          {
            "plate": "native",
            "cell": [
              13,
              17
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "foreground": false,
            "waist": 56,
            "join": [
              19,
              38
            ]
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
            "feet": 71,
            "waist": 57,
            "join": [
              22,
              32
            ]
          },
          {
            "plate": "native",
            "cell": [
              10,
              3
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "waist": 57,
            "join": [
              23,
              33
            ]
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
            "feet": 69,
            "waist": 54,
            "join": [
              21,
              40
            ]
          },
          {
            "plate": "native",
            "cell": [
              6,
              8
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "waist": 56,
            "join": [
              31,
              41
            ]
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
            "feet": 69,
            "waist": 56,
            "join": [
              23,
              33
            ]
          },
          {
            "plate": "native",
            "cell": [
              2,
              13
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "waist": 56,
            "join": [
              24,
              34
            ]
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
            "feet": 71,
            "waist": 56,
            "join": [
              23,
              43
            ]
          },
          {
            "plate": "native",
            "cell": [
              14,
              17
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "waist": 57,
            "join": [
              22,
              32
            ]
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
            "neck": 37,
            "feet": 75,
            "foreground": true,
            "waist": 58,
            "join": [
              21,
              41
            ]
          },
          {
            "plate": "native",
            "cell": [
              11,
              3
            ],
            "anchor": 71,
            "neck": 37,
            "feet": 75,
            "foreground": true,
            "waist": 58,
            "join": [
              19,
              43
            ]
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
            "neck": 40,
            "feet": 73,
            "foreground": true,
            "waist": 58,
            "join": [
              30,
              40
            ]
          },
          {
            "plate": "native",
            "cell": [
              7,
              8
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 73,
            "foreground": true,
            "waist": 59,
            "join": [
              17,
              40
            ]
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
            "neck": 41,
            "feet": 73,
            "foreground": true,
            "waist": 59,
            "join": [
              24,
              34
            ]
          },
          {
            "plate": "native",
            "cell": [
              3,
              13
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 73,
            "foreground": true,
            "waist": 59,
            "join": [
              24,
              47
            ]
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
            "neck": 36,
            "feet": 75,
            "foreground": true,
            "waist": 57,
            "join": [
              24,
              44
            ]
          },
          {
            "plate": "native",
            "cell": [
              15,
              17
            ],
            "anchor": 71,
            "neck": 36,
            "feet": 75,
            "foreground": true,
            "waist": 57,
            "join": [
              22,
              47
            ]
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
            "neck": 41,
            "feet": 71,
            "foreground": false,
            "waist": 58,
            "join": [
              17,
              38
            ]
          },
          {
            "plate": "native",
            "cell": [
              12,
              3
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "foreground": false,
            "waist": 58,
            "join": [
              12,
              38
            ]
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
            "foreground": false,
            "waist": 55,
            "join": [
              15,
              36
            ]
          },
          {
            "plate": "native",
            "cell": [
              8,
              8
            ],
            "anchor": 69,
            "neck": 35,
            "feet": 69,
            "foreground": false,
            "waist": 54,
            "join": [
              9,
              37
            ]
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
            "neck": 39,
            "feet": 69,
            "foreground": false,
            "waist": 56,
            "join": [
              29,
              49
            ]
          },
          {
            "plate": "native",
            "cell": [
              4,
              13
            ],
            "anchor": 69,
            "neck": 36,
            "feet": 69,
            "foreground": false,
            "waist": 54,
            "join": [
              27,
              56
            ]
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
            "neck": 39,
            "feet": 71,
            "foreground": false,
            "waist": 57,
            "join": [
              28,
              49
            ]
          },
          {
            "plate": "native",
            "cell": [
              0,
              18
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": false,
            "waist": 57,
            "join": [
              26,
              53
            ]
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
            "foreground": true,
            "waist": 53,
            "join": [
              30,
              40
            ]
          },
          {
            "plate": "native",
            "cell": [
              13,
              3
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 67,
            "foreground": true,
            "waist": 54,
            "join": [
              31,
              55
            ]
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
            "neck": 41,
            "feet": 65,
            "foreground": true,
            "waist": 52,
            "join": [
              27,
              54
            ]
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
            "foreground": true,
            "waist": 52,
            "join": [
              28,
              53
            ]
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
            "neck": 42,
            "feet": 65,
            "foreground": true,
            "waist": 55,
            "join": [
              26,
              36
            ]
          },
          {
            "plate": "native",
            "cell": [
              5,
              13
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 65,
            "foreground": true,
            "waist": 52,
            "join": [
              26,
              36
            ]
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
            "neck": 38,
            "feet": 67,
            "foreground": true,
            "waist": 52,
            "join": [
              4,
              32
            ]
          },
          {
            "plate": "native",
            "cell": [
              1,
              18
            ],
            "anchor": 71,
            "neck": 37,
            "feet": 67,
            "foreground": true,
            "waist": 54,
            "join": [
              8,
              33
            ]
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
            "neck": 40,
            "feet": 71,
            "foreground": true,
            "waist": 57,
            "join": [
              21,
              32
            ]
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
            "foreground": true,
            "waist": 56,
            "join": [
              22,
              44
            ]
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
            "neck": 41,
            "feet": 69,
            "foreground": true,
            "waist": 56,
            "join": [
              23,
              45
            ]
          },
          {
            "plate": "native",
            "cell": [
              10,
              8
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69,
            "foreground": true,
            "waist": 56,
            "join": [
              21,
              43
            ]
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
            "neck": 42,
            "feet": 69,
            "foreground": true,
            "waist": 57,
            "join": [
              22,
              33
            ]
          },
          {
            "plate": "native",
            "cell": [
              6,
              13
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 69,
            "foreground": true,
            "waist": 57,
            "join": [
              22,
              32
            ]
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
            "foreground": true,
            "waist": 56,
            "join": [
              19,
              41
            ]
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
            "foreground": true,
            "waist": 56,
            "join": [
              21,
              42
            ]
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
            "neck": 38,
            "feet": 71,
            "foreground": false,
            "waist": 56,
            "join": [
              27,
              45
            ]
          },
          {
            "plate": "native",
            "cell": [
              15,
              3
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "foreground": false,
            "waist": 58,
            "join": [
              24,
              45
            ]
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
            "foreground": false,
            "waist": 57,
            "join": [
              24,
              43
            ]
          },
          {
            "plate": "native",
            "cell": [
              11,
              8
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69,
            "foreground": false,
            "waist": 56,
            "join": [
              24,
              43
            ]
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
            "neck": 43,
            "feet": 69,
            "foreground": false,
            "waist": 57,
            "join": [
              22,
              41
            ]
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
            "foreground": false,
            "waist": 57,
            "join": [
              21,
              40
            ]
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
            "neck": 38,
            "feet": 71,
            "foreground": false,
            "waist": 56,
            "join": [
              19,
              37
            ]
          },
          {
            "plate": "native",
            "cell": [
              3,
              18
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "foreground": false,
            "waist": 57,
            "join": [
              19,
              38
            ]
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
            "neck": 35,
            "feet": 71,
            "foreground": true,
            "waist": 55,
            "join": [
              23,
              36
            ]
          },
          {
            "plate": "native",
            "cell": [
              0,
              4
            ],
            "anchor": 71,
            "neck": 35,
            "feet": 71,
            "foreground": true,
            "waist": 55,
            "join": [
              24,
              37
            ]
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
            "neck": 40,
            "feet": 69,
            "foreground": true,
            "waist": 56,
            "join": [
              21,
              32
            ]
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
            "foreground": true,
            "waist": 56,
            "join": [
              21,
              32
            ]
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
            "foreground": true,
            "waist": 56,
            "join": [
              32,
              44
            ]
          },
          {
            "plate": "native",
            "cell": [
              8,
              13
            ],
            "anchor": 69,
            "neck": 37,
            "feet": 69,
            "foreground": true,
            "waist": 55,
            "join": [
              32,
              44
            ]
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
            "neck": 34,
            "feet": 71,
            "foreground": true,
            "waist": 54,
            "join": [
              28,
              41
            ]
          },
          {
            "plate": "native",
            "cell": [
              4,
              18
            ],
            "anchor": 71,
            "neck": 34,
            "feet": 71,
            "foreground": true,
            "waist": 54,
            "join": [
              26,
              39
            ]
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
            "neck": 37,
            "feet": 71,
            "foreground": true,
            "waist": 56,
            "join": [
              22,
              34
            ]
          },
          {
            "plate": "native",
            "cell": [
              1,
              4
            ],
            "anchor": 71,
            "neck": 37,
            "feet": 71,
            "foreground": true,
            "waist": 56,
            "join": [
              22,
              35
            ]
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
            "neck": 42,
            "feet": 69,
            "foreground": true,
            "waist": 57,
            "join": [
              34,
              45
            ]
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
            "foreground": true,
            "waist": 56,
            "join": [
              33,
              44
            ]
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
            "foreground": true,
            "waist": 56,
            "join": [
              32,
              46
            ]
          },
          {
            "plate": "native",
            "cell": [
              9,
              13
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "foreground": true,
            "waist": 56,
            "join": [
              33,
              46
            ]
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
            "neck": 36,
            "feet": 71,
            "foreground": true,
            "waist": 55,
            "join": [
              17,
              42
            ]
          },
          {
            "plate": "native",
            "cell": [
              5,
              18
            ],
            "anchor": 71,
            "neck": 36,
            "feet": 71,
            "foreground": true,
            "waist": 55,
            "join": [
              17,
              40
            ]
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
            "neck": 39,
            "feet": 71,
            "foreground": false,
            "waist": 57,
            "join": [
              21,
              40
            ]
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
            "foreground": false,
            "waist": 58,
            "join": [
              23,
              41
            ]
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
            "neck": 40,
            "feet": 69,
            "foreground": false,
            "waist": 56,
            "join": [
              22,
              40
            ]
          },
          {
            "plate": "native",
            "cell": [
              14,
              8
            ],
            "anchor": 69,
            "neck": 43,
            "feet": 69,
            "foreground": false,
            "waist": 57,
            "join": [
              22,
              41
            ]
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
            "neck": 40,
            "feet": 69,
            "foreground": false,
            "waist": 56,
            "join": [
              25,
              43
            ]
          },
          {
            "plate": "native",
            "cell": [
              10,
              13
            ],
            "anchor": 69,
            "neck": 43,
            "feet": 69,
            "foreground": false,
            "waist": 57,
            "join": [
              24,
              44
            ]
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
            "neck": 38,
            "feet": 71,
            "foreground": false,
            "waist": 56,
            "join": [
              23,
              42
            ]
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
            "foreground": false,
            "waist": 58,
            "join": [
              24,
              42
            ]
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
            "neck": 33,
            "feet": 71,
            "foreground": true,
            "waist": 54,
            "join": [
              31,
              42
            ]
          },
          {
            "plate": "native",
            "cell": [
              3,
              4
            ],
            "anchor": 71,
            "neck": 32,
            "feet": 71,
            "foreground": true,
            "waist": 53,
            "join": [
              32,
              42
            ]
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
            "foreground": true,
            "waist": 54,
            "join": [
              29,
              50
            ]
          },
          {
            "plate": "native",
            "cell": [
              15,
              8
            ],
            "anchor": 69,
            "neck": 32,
            "feet": 69,
            "foreground": true,
            "waist": 51,
            "join": [
              29,
              49
            ]
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
            "foreground": true,
            "waist": 54,
            "join": [
              13,
              35
            ]
          },
          {
            "plate": "native",
            "cell": [
              11,
              13
            ],
            "anchor": 69,
            "neck": 34,
            "feet": 69,
            "foreground": true,
            "waist": 53,
            "join": [
              27,
              37
            ]
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
            "neck": 32,
            "feet": 71,
            "foreground": true,
            "waist": 53,
            "join": [
              23,
              34
            ]
          },
          {
            "plate": "native",
            "cell": [
              7,
              18
            ],
            "anchor": 71,
            "neck": 33,
            "feet": 71,
            "foreground": true,
            "waist": 54,
            "join": [
              23,
              34
            ]
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
            "feet": 71,
            "waist": 57,
            "join": [
              21.333333333333332,
              40
            ]
          },
          {
            "plate": "walk",
            "cell": [
              8,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "waist": 57,
            "join": [
              21.333333333333332,
              40
            ]
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
            "feet": 69,
            "waist": 54,
            "join": [
              23.666666666666668,
              42
            ]
          },
          {
            "plate": "walk",
            "cell": [
              8,
              1
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "waist": 54,
            "join": [
              23.333333333333332,
              42.666666666666664
            ]
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
            "feet": 69,
            "waist": 55,
            "join": [
              22,
              41.333333333333336
            ]
          },
          {
            "plate": "walk",
            "cell": [
              8,
              2
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "waist": 56,
            "join": [
              31.666666666666668,
              42.333333333333336
            ]
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
            "feet": 71,
            "waist": 57,
            "join": [
              23.333333333333332,
              42.666666666666664
            ]
          },
          {
            "plate": "walk",
            "cell": [
              8,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "waist": 57,
            "join": [
              23.666666666666668,
              42.666666666666664
            ]
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
            "neck": 40,
            "feet": 70,
            "waist": 57,
            "join": [
              28,
              42
            ]
          },
          {
            "plate": "native",
            "cell": [
              4,
              4
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 70,
            "waist": 56,
            "join": [
              14,
              39
            ]
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
            "neck": 40,
            "feet": 68,
            "waist": 55,
            "join": [
              14,
              39
            ]
          },
          {
            "plate": "native",
            "cell": [
              0,
              9
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 68,
            "waist": 55,
            "join": [
              18,
              47
            ]
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
            "neck": 40,
            "feet": 68,
            "waist": 55,
            "join": [
              24,
              50
            ]
          },
          {
            "plate": "native",
            "cell": [
              12,
              13
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 68,
            "waist": 55,
            "join": [
              22,
              50
            ]
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
            "neck": 39,
            "feet": 70,
            "waist": 56,
            "join": [
              26,
              52
            ]
          },
          {
            "plate": "native",
            "cell": [
              8,
              18
            ],
            "anchor": 71,
            "neck": 37,
            "feet": 70,
            "waist": 55,
            "join": [
              27,
              51
            ]
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
            "feet": 71,
            "waist": 58,
            "join": [
              23.666666666666668,
              39.333333333333336
            ]
          },
          {
            "plate": "walk",
            "cell": [
              9,
              0
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "waist": 58,
            "join": [
              24,
              39.333333333333336
            ]
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
            "feet": 69,
            "waist": 56,
            "join": [
              25.333333333333332,
              40.666666666666664
            ]
          },
          {
            "plate": "walk",
            "cell": [
              9,
              1
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69,
            "waist": 56,
            "join": [
              25.333333333333332,
              41.333333333333336
            ]
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
            "feet": 69,
            "waist": 56,
            "join": [
              25,
              39.333333333333336
            ]
          },
          {
            "plate": "walk",
            "cell": [
              9,
              2
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69,
            "waist": 56,
            "join": [
              24.666666666666668,
              40
            ]
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
            "feet": 71,
            "waist": 58,
            "join": [
              23.666666666666668,
              37.666666666666664
            ]
          },
          {
            "plate": "walk",
            "cell": [
              9,
              3
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "waist": 58,
            "join": [
              23.666666666666668,
              38
            ]
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
            "neck": 41,
            "feet": 71,
            "waist": 58,
            "join": [
              13,
              40
            ]
          },
          {
            "plate": "native",
            "cell": [
              5,
              4
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "waist": 58,
            "join": [
              15,
              40
            ]
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
            "neck": 42,
            "feet": 69,
            "waist": 57,
            "join": [
              15,
              40
            ]
          },
          {
            "plate": "native",
            "cell": [
              1,
              9
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69,
            "waist": 56,
            "join": [
              22,
              47
            ]
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
            "neck": 43,
            "feet": 69,
            "waist": 57,
            "join": [
              23,
              49
            ]
          },
          {
            "plate": "native",
            "cell": [
              13,
              13
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "waist": 56,
            "join": [
              21,
              46
            ]
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
            "feet": 71,
            "waist": 57,
            "join": [
              25,
              50
            ]
          },
          {
            "plate": "native",
            "cell": [
              9,
              18
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "waist": 57,
            "join": [
              26,
              50
            ]
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
            "feet": 71,
            "waist": 57,
            "join": [
              23.666666666666668,
              41.333333333333336
            ]
          },
          {
            "plate": "walk",
            "cell": [
              10,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "waist": 57,
            "join": [
              23.666666666666668,
              41
            ]
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
            "feet": 69,
            "waist": 56,
            "join": [
              25.666666666666668,
              40.666666666666664
            ]
          },
          {
            "plate": "walk",
            "cell": [
              10,
              1
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "waist": 56,
            "join": [
              25,
              42
            ]
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
            "feet": 69,
            "waist": 56,
            "join": [
              22.333333333333332,
              39
            ]
          },
          {
            "plate": "walk",
            "cell": [
              10,
              2
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "waist": 56,
            "join": [
              22,
              40
            ]
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
            "feet": 71,
            "waist": 57,
            "join": [
              23.333333333333332,
              41
            ]
          },
          {
            "plate": "walk",
            "cell": [
              10,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "waist": 57,
            "join": [
              23.333333333333332,
              40.333333333333336
            ]
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
            "neck": 40,
            "feet": 71,
            "waist": 57,
            "join": [
              20,
              40
            ]
          },
          {
            "plate": "native",
            "cell": [
              6,
              4
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "waist": 57,
            "join": [
              17,
              40
            ]
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
            "neck": 40,
            "feet": 69,
            "waist": 56,
            "join": [
              20,
              38
            ]
          },
          {
            "plate": "native",
            "cell": [
              2,
              9
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 69,
            "waist": 55,
            "join": [
              19,
              38
            ]
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
            "neck": 40,
            "feet": 69,
            "waist": 56,
            "join": [
              25,
              43
            ]
          },
          {
            "plate": "native",
            "cell": [
              14,
              13
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "waist": 56,
            "join": [
              27,
              46
            ]
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
            "neck": 40,
            "feet": 71,
            "waist": 57,
            "join": [
              25,
              43
            ]
          },
          {
            "plate": "native",
            "cell": [
              10,
              18
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "waist": 57,
            "join": [
              23,
              46
            ]
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
            "feet": 71,
            "waist": 57,
            "join": [
              21.333333333333332,
              41.666666666666664
            ]
          },
          {
            "plate": "walk",
            "cell": [
              11,
              0
            ],
            "anchor": 71,
            "neck": 39.333333333333336,
            "feet": 71,
            "waist": 57,
            "join": [
              21.666666666666668,
              41.666666666666664
            ]
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
            "feet": 69,
            "waist": 54,
            "join": [
              24,
              42.666666666666664
            ]
          },
          {
            "plate": "walk",
            "cell": [
              11,
              1
            ],
            "anchor": 69,
            "neck": 39.333333333333336,
            "feet": 69,
            "waist": 56,
            "join": [
              23.333333333333332,
              33.333333333333336
            ]
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
            "feet": 69,
            "waist": 53,
            "join": [
              21.333333333333332,
              40.333333333333336
            ]
          },
          {
            "plate": "walk",
            "cell": [
              11,
              2
            ],
            "anchor": 69,
            "neck": 39.333333333333336,
            "feet": 69,
            "waist": 56,
            "join": [
              31,
              41.333333333333336
            ]
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
            "feet": 71,
            "waist": 57,
            "join": [
              22,
              42.333333333333336
            ]
          },
          {
            "plate": "walk",
            "cell": [
              11,
              3
            ],
            "anchor": 71,
            "neck": 39.333333333333336,
            "feet": 71,
            "waist": 57,
            "join": [
              21.333333333333332,
              43
            ]
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
            "neck": 37,
            "feet": 69,
            "waist": 55,
            "join": [
              21,
              42
            ]
          },
          {
            "plate": "native",
            "cell": [
              7,
              4
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 69,
            "waist": 55,
            "join": [
              18,
              41
            ]
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
            "neck": 39,
            "feet": 67,
            "waist": 54,
            "join": [
              22,
              39
            ]
          },
          {
            "plate": "native",
            "cell": [
              3,
              9
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 67,
            "waist": 54,
            "join": [
              20,
              39
            ]
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
            "neck": 40,
            "feet": 67,
            "waist": 55,
            "join": [
              24,
              42
            ]
          },
          {
            "plate": "native",
            "cell": [
              15,
              13
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 67,
            "waist": 54,
            "join": [
              25,
              44
            ]
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
            "feet": 69,
            "waist": 55,
            "join": [
              24,
              41
            ]
          },
          {
            "plate": "native",
            "cell": [
              11,
              18
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 69,
            "waist": 55,
            "join": [
              22,
              44
            ]
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
            "feet": 71,
            "waist": 57,
            "join": [
              21,
              32
            ]
          },
          {
            "plate": "walk",
            "cell": [
              12,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "waist": 57,
            "join": [
              21.333333333333332,
              43
            ]
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
            "feet": 69,
            "waist": 56,
            "join": [
              21.666666666666668,
              32.333333333333336
            ]
          },
          {
            "plate": "walk",
            "cell": [
              12,
              1
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "waist": 56,
            "join": [
              20.666666666666668,
              32.666666666666664
            ]
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
            "feet": 69,
            "waist": 54,
            "join": [
              22.333333333333332,
              41.333333333333336
            ]
          },
          {
            "plate": "walk",
            "cell": [
              12,
              2
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "waist": 56,
            "join": [
              21.333333333333332,
              31.666666666666668
            ]
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
            "feet": 71,
            "waist": 56,
            "join": [
              23.333333333333332,
              43
            ]
          },
          {
            "plate": "walk",
            "cell": [
              12,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "waist": 57,
            "join": [
              22,
              44
            ]
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
            "neck": 42,
            "feet": 70,
            "waist": 57,
            "join": [
              14,
              46
            ]
          },
          {
            "plate": "native",
            "cell": [
              8,
              4
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 70,
            "waist": 57,
            "join": [
              27,
              44
            ]
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
            "neck": 41,
            "feet": 68,
            "waist": 56,
            "join": [
              13,
              45
            ]
          },
          {
            "plate": "native",
            "cell": [
              4,
              9
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 68,
            "waist": 55,
            "join": [
              14,
              40
            ]
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
            "neck": 41,
            "feet": 68,
            "waist": 56,
            "join": [
              17,
              48
            ]
          },
          {
            "plate": "native",
            "cell": [
              0,
              14
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 68,
            "waist": 56,
            "join": [
              23,
              36
            ]
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
            "neck": 41,
            "feet": 70,
            "waist": 57,
            "join": [
              18,
              48
            ]
          },
          {
            "plate": "native",
            "cell": [
              12,
              18
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 70,
            "waist": 57,
            "join": [
              27,
              53
            ]
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
            "feet": 71,
            "waist": 58,
            "join": [
              22.666666666666668,
              40.333333333333336
            ]
          },
          {
            "plate": "walk",
            "cell": [
              13,
              0
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "waist": 58,
            "join": [
              22.666666666666668,
              40.333333333333336
            ]
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
            "feet": 69,
            "waist": 56,
            "join": [
              27,
              38.666666666666664
            ]
          },
          {
            "plate": "walk",
            "cell": [
              13,
              1
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69,
            "waist": 56,
            "join": [
              26.666666666666668,
              39.333333333333336
            ]
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
            "feet": 69,
            "waist": 56,
            "join": [
              24,
              39
            ]
          },
          {
            "plate": "walk",
            "cell": [
              13,
              2
            ],
            "anchor": 69,
            "neck": 41,
            "feet": 69,
            "waist": 56,
            "join": [
              23.333333333333332,
              39.666666666666664
            ]
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
            "feet": 71,
            "waist": 58,
            "join": [
              24.666666666666668,
              39.666666666666664
            ]
          },
          {
            "plate": "walk",
            "cell": [
              13,
              3
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "waist": 58,
            "join": [
              25.333333333333332,
              41.666666666666664
            ]
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
            "feet": 71,
            "waist": 58,
            "join": [
              16,
              40
            ]
          },
          {
            "plate": "native",
            "cell": [
              9,
              4
            ],
            "anchor": 71,
            "neck": 41,
            "feet": 71,
            "waist": 58,
            "join": [
              12,
              39
            ]
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
            "neck": 43,
            "feet": 69,
            "waist": 57,
            "join": [
              15,
              46
            ]
          },
          {
            "plate": "native",
            "cell": [
              5,
              9
            ],
            "anchor": 69,
            "neck": 42,
            "feet": 69,
            "waist": 57,
            "join": [
              15,
              41
            ]
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
            "neck": 44,
            "feet": 69,
            "waist": 58,
            "join": [
              16,
              47
            ]
          },
          {
            "plate": "native",
            "cell": [
              1,
              14
            ],
            "anchor": 69,
            "neck": 43,
            "feet": 69,
            "waist": 57,
            "join": [
              21,
              49
            ]
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
            "neck": 43,
            "feet": 71,
            "waist": 58,
            "join": [
              23,
              47
            ]
          },
          {
            "plate": "native",
            "cell": [
              13,
              18
            ],
            "anchor": 71,
            "neck": 43,
            "feet": 71,
            "waist": 58,
            "join": [
              26,
              51
            ]
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
            "feet": 71,
            "waist": 57,
            "join": [
              23,
              38.666666666666664
            ]
          },
          {
            "plate": "walk",
            "cell": [
              14,
              0
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "waist": 57,
            "join": [
              22.666666666666668,
              38.666666666666664
            ]
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
            "feet": 69,
            "waist": 56,
            "join": [
              26.333333333333332,
              40
            ]
          },
          {
            "plate": "walk",
            "cell": [
              14,
              1
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "waist": 56,
            "join": [
              26,
              40.666666666666664
            ]
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
            "feet": 69,
            "waist": 56,
            "join": [
              24,
              39.333333333333336
            ]
          },
          {
            "plate": "walk",
            "cell": [
              14,
              2
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "waist": 56,
            "join": [
              23.666666666666668,
              40
            ]
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
            "feet": 71,
            "waist": 57,
            "join": [
              25.333333333333332,
              40.666666666666664
            ]
          },
          {
            "plate": "walk",
            "cell": [
              14,
              3
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "waist": 57,
            "join": [
              24.666666666666668,
              41
            ]
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
            "neck": 40,
            "feet": 71,
            "waist": 57,
            "join": [
              22,
              40
            ]
          },
          {
            "plate": "native",
            "cell": [
              10,
              4
            ],
            "anchor": 71,
            "neck": 39,
            "feet": 71,
            "waist": 57,
            "join": [
              22,
              40
            ]
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
            "neck": 40,
            "feet": 69,
            "waist": 56,
            "join": [
              20,
              39
            ]
          },
          {
            "plate": "native",
            "cell": [
              6,
              9
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 69,
            "waist": 55,
            "join": [
              20,
              37
            ]
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
            "neck": 41,
            "feet": 69,
            "waist": 56,
            "join": [
              24,
              42
            ]
          },
          {
            "plate": "native",
            "cell": [
              2,
              14
            ],
            "anchor": 69,
            "neck": 39,
            "feet": 69,
            "waist": 56,
            "join": [
              27,
              46
            ]
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
            "neck": 40,
            "feet": 71,
            "waist": 57,
            "join": [
              24,
              41
            ]
          },
          {
            "plate": "native",
            "cell": [
              14,
              18
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 71,
            "waist": 56,
            "join": [
              26,
              43
            ]
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
            "feet": 71,
            "waist": 57,
            "join": [
              22.333333333333332,
              38
            ]
          },
          {
            "plate": "walk",
            "cell": [
              15,
              0
            ],
            "anchor": 71,
            "neck": 39.333333333333336,
            "feet": 71,
            "waist": 57,
            "join": [
              22,
              38.666666666666664
            ]
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
            "feet": 69,
            "waist": 56,
            "join": [
              27.666666666666668,
              39.666666666666664
            ]
          },
          {
            "plate": "walk",
            "cell": [
              15,
              1
            ],
            "anchor": 69,
            "neck": 39.333333333333336,
            "feet": 69,
            "waist": 56,
            "join": [
              27.333333333333332,
              41.333333333333336
            ]
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
            "feet": 69,
            "waist": 56,
            "join": [
              26,
              38.333333333333336
            ]
          },
          {
            "plate": "walk",
            "cell": [
              15,
              2
            ],
            "anchor": 69,
            "neck": 39.333333333333336,
            "feet": 69,
            "waist": 56,
            "join": [
              25,
              38.666666666666664
            ]
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
            "feet": 71,
            "waist": 57,
            "join": [
              25.666666666666668,
              41.333333333333336
            ]
          },
          {
            "plate": "walk",
            "cell": [
              15,
              3
            ],
            "anchor": 71,
            "neck": 39.333333333333336,
            "feet": 71,
            "waist": 57,
            "join": [
              25.666666666666668,
              42.333333333333336
            ]
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
            "neck": 37,
            "feet": 69,
            "waist": 55,
            "join": [
              24,
              41
            ]
          },
          {
            "plate": "native",
            "cell": [
              11,
              4
            ],
            "anchor": 71,
            "neck": 37,
            "feet": 69,
            "waist": 55,
            "join": [
              24,
              42
            ]
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
            "neck": 40,
            "feet": 67,
            "waist": 55,
            "join": [
              21,
              40
            ]
          },
          {
            "plate": "native",
            "cell": [
              7,
              9
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 67,
            "waist": 54,
            "join": [
              21,
              38
            ]
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
            "neck": 40,
            "feet": 67,
            "waist": 55,
            "join": [
              23,
              41
            ]
          },
          {
            "plate": "native",
            "cell": [
              3,
              14
            ],
            "anchor": 69,
            "neck": 38,
            "feet": 67,
            "waist": 54,
            "join": [
              26,
              45
            ]
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
            "feet": 69,
            "waist": 55,
            "join": [
              23,
              39
            ]
          },
          {
            "plate": "native",
            "cell": [
              15,
              18
            ],
            "anchor": 71,
            "neck": 38,
            "feet": 69,
            "waist": 55,
            "join": [
              25,
              42
            ]
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
            "feet": 71,
            "waist": 57,
            "join": [
              22,
              32
            ]
          },
          {
            "plate": "native",
            "cell": [
              8,
              2
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "waist": 57,
            "join": [
              23,
              44
            ]
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
            "feet": 69,
            "waist": 55,
            "join": [
              21,
              40
            ]
          },
          {
            "plate": "native",
            "cell": [
              4,
              7
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "waist": 56,
            "join": [
              31,
              41
            ]
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
            "feet": 69,
            "waist": 56,
            "join": [
              24,
              43
            ]
          },
          {
            "plate": "native",
            "cell": [
              0,
              12
            ],
            "anchor": 69,
            "neck": 40,
            "feet": 69,
            "waist": 56,
            "join": [
              25,
              35
            ]
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
            "feet": 71,
            "waist": 57,
            "join": [
              23,
              43
            ]
          },
          {
            "plate": "native",
            "cell": [
              12,
              16
            ],
            "anchor": 71,
            "neck": 40,
            "feet": 71,
            "waist": 57,
            "join": [
              23,
              43
            ]
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
  "id": "3136c053375b8eeec21578b1edf8b1812d1290ac427a1c06f5deb4cea00edd19"
};
