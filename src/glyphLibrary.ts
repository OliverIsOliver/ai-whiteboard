import type { NormalizeGlyphOptions } from "./programmaticApi";

// File-backed glyph source data. Keep these in absolute designer coordinates;
// the runtime normalizes them into relative glyph-space on load.
export const BUILTIN_GLYPH_SOURCES: readonly NormalizeGlyphOptions[] = [
  {
    char: "A",
    advance: 154,
    strokes: [
      {
        segments: [
          {
            start: { x: 175, y: 420 },
            control1: { x: 176, y: 412 },
            control2: { x: 225, y: 186 },
            end: { x: 246, y: 186 },
          },
          {
            start: { x: 246, y: 186 },
            control1: { x: 267, y: 186 },
            control2: { x: 316, y: 412 },
            end: { x: 317, y: 420 },
          },
        ],
      },
      {
        segments: [
          {
            start: { x: 198.85, y: 318 },
            control1: { x: 229.9, y: 314 },
            control2: { x: 262.1, y: 314 },
            end: { x: 293.15, y: 318 },
          },
        ],
      },
    ],
  },
  {
    "char": "B",
    "advance": 174,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 205.68,
              "y": 191.8
            },
            "control1": {
              "x": 181.04,
              "y": 178.4
            },
            "control2": {
              "x": 198.26,
              "y": 388
            },
            "end": {
              "x": 189.16,
              "y": 462
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 207.92,
              "y": 191.8
            },
            "control1": {
              "x": 231.16,
              "y": 187.4
            },
            "control2": {
              "x": 322.16,
              "y": 210
            },
            "end": {
              "x": 323.56,
              "y": 252
            }
          },
          {
            "start": {
              "x": 323.56,
              "y": 252
            },
            "control1": {
              "x": 323.56,
              "y": 292
            },
            "control2": {
              "x": 242.36,
              "y": 318
            },
            "end": {
              "x": 189.16,
              "y": 322
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 189.16,
              "y": 322
            },
            "control1": {
              "x": 252.16,
              "y": 323
            },
            "control2": {
              "x": 343.16,
              "y": 345
            },
            "end": {
              "x": 343.16,
              "y": 393
            }
          },
          {
            "start": {
              "x": 343.16,
              "y": 393
            },
            "control1": {
              "x": 343.16,
              "y": 447
            },
            "control2": {
              "x": 259.16,
              "y": 465
            },
            "end": {
              "x": 189.16,
              "y": 462
            }
          }
        ]
      }
    ]
  },
  {
    "char": "C",
    "advance": 196,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 299.7,
              "y": 214
            },
            "control1": {
              "x": 268.4,
              "y": 188
            },
            "control2": {
              "x": 195.4,
              "y": 178
            },
            "end": {
              "x": 156.7,
              "y": 232
            }
          },
          {
            "start": {
              "x": 156.7,
              "y": 232
            },
            "control1": {
              "x": 127.5,
              "y": 272
            },
            "control2": {
              "x": 127.5,
              "y": 376
            },
            "end": {
              "x": 156.7,
              "y": 418
            }
          },
          {
            "start": {
              "x": 156.7,
              "y": 418
            },
            "control1": {
              "x": 195.4,
              "y": 472
            },
            "control2": {
              "x": 271.5,
              "y": 458
            },
            "end": {
              "x": 301.8,
              "y": 432
            }
          }
        ]
      }
    ]
  },
  {
    "char": "D",
    "advance": 196,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 180,
              "y": 190
            },
            "control1": {
              "x": 170,
              "y": 260
            },
            "control2": {
              "x": 170,
              "y": 390
            },
            "end": {
              "x": 180,
              "y": 460
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 180,
              "y": 190
            },
            "control1": {
              "x": 262,
              "y": 180
            },
            "control2": {
              "x": 350,
              "y": 245
            },
            "end": {
              "x": 350,
              "y": 325
            }
          },
          {
            "start": {
              "x": 350,
              "y": 325
            },
            "control1": {
              "x": 350,
              "y": 405
            },
            "control2": {
              "x": 262,
              "y": 470
            },
            "end": {
              "x": 180,
              "y": 460
            }
          }
        ]
      }
    ]
  },
  {
    "char": "E",
    "advance": 178,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 316,
              "y": 192
            },
            "control1": {
              "x": 280,
              "y": 190
            },
            "control2": {
              "x": 230,
              "y": 190
            },
            "end": {
              "x": 186,
              "y": 194
            }
          },
          {
            "start": {
              "x": 186,
              "y": 194
            },
            "control1": {
              "x": 176,
              "y": 250
            },
            "control2": {
              "x": 176,
              "y": 396
            },
            "end": {
              "x": 188,
              "y": 458
            }
          },
          {
            "start": {
              "x": 188,
              "y": 458
            },
            "control1": {
              "x": 250,
              "y": 456
            },
            "control2": {
              "x": 298,
              "y": 456
            },
            "end": {
              "x": 326,
              "y": 462
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 178,
              "y": 322
            },
            "control1": {
              "x": 228,
              "y": 318
            },
            "control2": {
              "x": 260,
              "y": 320
            },
            "end": {
              "x": 284,
              "y": 326
            }
          }
        ]
      }
    ]
  },
  { 
    "char": "F",
    "advance": 146,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 318,
              "y": 192
            },
            "control1": {
              "x": 284,
              "y": 191
            },
            "control2": {
              "x": 232,
              "y": 191
            },
            "end": {
              "x": 186,
              "y": 194
            }
          },
          {
            "start": {
              "x": 186,
              "y": 194
            },
            "control1": {
              "x": 183,
              "y": 250
            },
            "control2": {
              "x": 185,
              "y": 396
            },
            "end": {
              "x": 188,
              "y": 462
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 184,
              "y": 322
            },
            "control1": {
              "x": 224,
              "y": 320
            },
            "control2": {
              "x": 252,
              "y": 322
            },
            "end": {
              "x": 274,
              "y": 324
            }
          }
        ]
      }
    ]
  },
  {
    "char": "G",
    "advance": 246,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 348.2,
              "y": 212
            },
            "control1": {
              "x": 311.8,
              "y": 188
            },
            "control2": {
              "x": 225,
              "y": 176
            },
            "end": {
              "x": 169,
              "y": 230
            }
          },
          {
            "start": {
              "x": 169,
              "y": 230
            },
            "control1": {
              "x": 134,
              "y": 275
            },
            "control2": {
              "x": 134,
              "y": 375
            },
            "end": {
              "x": 169,
              "y": 420
            }
          },
          {
            "start": {
              "x": 169,
              "y": 420
            },
            "control1": {
              "x": 225,
              "y": 468
            },
            "control2": {
              "x": 311.8,
              "y": 468
            },
            "end": {
              "x": 351,
              "y": 333
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 351,
              "y": 333
            },
            "control1": {
              "x": 309,
              "y": 328
            },
            "control2": {
              "x": 267,
              "y": 328
            },
            "end": {
              "x": 225,
              "y": 330
            }
          }
        ]
      }
    ]
  },
  {
    "char": "H",
    "advance": 186,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 182,
              "y": 190
            },
            "control1": {
              "x": 176,
              "y": 258
            },
            "control2": {
              "x": 176,
              "y": 392
            },
            "end": {
              "x": 182,
              "y": 462
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 314,
              "y": 190
            },
            "control1": {
              "x": 320,
              "y": 258
            },
            "control2": {
              "x": 320,
              "y": 392
            },
            "end": {
              "x": 314,
              "y": 462
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 176,
              "y": 324
            },
            "control1": {
              "x": 220,
              "y": 320
            },
            "control2": {
              "x": 274,
              "y": 320
            },
            "end": {
              "x": 320,
              "y": 324
            }
          }
        ]
      }
    ]
  },
  {
    "char": "I",
    "advance": 100,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 210,
              "y": 190
            },
            "control1": {
              "x": 240,
              "y": 186
            },
            "control2": {
              "x": 260,
              "y": 186
            },
            "end": {
              "x": 290,
              "y": 190
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 250,
              "y": 190
            },
            "control1": {
              "x": 246,
              "y": 260
            },
            "control2": {
              "x": 246,
              "y": 392
            },
            "end": {
              "x": 250,
              "y": 458
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 210,
              "y": 462
            },
            "control1": {
              "x": 240,
              "y": 458
            },
            "control2": {
              "x": 260,
              "y": 458
            },
            "end": {
              "x": 290,
              "y": 462
            }
          }
        ]
      }
    ]
  },
  {
    char: "J",
    advance: 215,
    strokes: [
      {
        segments: [
          {
            start: { x: 310, y: 190 },
            control1: { x: 305, y: 260 },
            control2: { x: 305, y: 400 },
            end: { x: 310, y: 460 },
          },
          {
            start: { x: 310, y: 460 },
            control1: { x: 305, y: 520 },
            control2: { x: 230, y: 560 },
            end: { x: 150, y: 480 },
          },
        ],
      },
      {
        segments: [
          {
            start: { x: 240, y: 192 },
            control1: { x: 285, y: 186 },
            control2: { x: 335, y: 186 },
            end: { x: 360, y: 192 },
          },
        ],
      },
    ],
  },
  {
    char: "K",
    advance: 170,
    strokes: [
      {
        segments: [
          {
            start: { x: 204, y: 190 },
            control1: { x: 200, y: 260 },
            control2: { x: 200, y: 392 },
            end: { x: 204, y: 462 },
          },
        ],
      },
      {
        segments: [
          {
            start: { x: 204, y: 320 },
            control1: { x: 252, y: 290 },
            control2: { x: 312, y: 240 },
            end: { x: 348, y: 190 },
          },
        ],
      },
      {
        segments: [
          {
            start: { x: 204, y: 320 },
            control1: { x: 258, y: 350 },
            control2: { x: 318, y: 420 },
            end: { x: 360, y: 462 },
          },
        ],
      },
    ],
  },
  {
    char: "L",
    advance: 175,
    strokes: [
      {
        segments: [
          {
            start: { x: 204, y: 190 },
            control1: { x: 200, y: 260 },
            control2: { x: 200, y: 392 },
            end: { x: 204, y: 462 },
          },
        ],
      },
      {
        segments: [
          {
            start: { x: 200, y: 462 },
            control1: { x: 260, y: 458 },
            control2: { x: 320, y: 458 },
            end: { x: 360, y: 462 },
          },
        ],
      },
    ],
  },
  {
    "char": "M",
    "advance": 250,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 169,
              "y": 462
            },
            "control1": {
              "x": 164,
              "y": 360
            },
            "control2": {
              "x": 164,
              "y": 260
            },
            "end": {
              "x": 169,
              "y": 190
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 169,
              "y": 190
            },
            "control1": {
              "x": 208,
              "y": 230
            },
            "control2": {
              "x": 234,
              "y": 300
            },
            "end": {
              "x": 260,
              "y": 320
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 260,
              "y": 320
            },
            "control1": {
              "x": 286,
              "y": 300
            },
            "control2": {
              "x": 312,
              "y": 230
            },
            "end": {
              "x": 351,
              "y": 190
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 351,
              "y": 190
            },
            "control1": {
              "x": 356,
              "y": 260
            },
            "control2": {
              "x": 356,
              "y": 360
            },
            "end": {
              "x": 351,
              "y": 462
            }
          }
        ]
      }
    ]
  },
  {
    "char": "N",
    "advance": 200,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 190,
              "y": 462
            },
            "control1": {
              "x": 186,
              "y": 360
            },
            "control2": {
              "x": 186,
              "y": 260
            },
            "end": {
              "x": 190,
              "y": 190
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 190,
              "y": 190
            },
            "control1": {
              "x": 240,
              "y": 290
            },
            "control2": {
              "x": 300,
              "y": 390
            },
            "end": {
              "x": 340,
              "y": 462
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 340,
              "y": 190
            },
            "control1": {
              "x": 344,
              "y": 260
            },
            "control2": {
              "x": 344,
              "y": 360
            },
            "end": {
              "x": 340,
              "y": 462
            }
          }
        ]
      }
    ]
  },
  {
    "char": "O",
    "advance": 240,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 260,
              "y": 190
            },
            "control1": {
              "x": 346.4,
              "y": 190
            },
            "control2": {
              "x": 368,
              "y": 260
            },
            "end": {
              "x": 368,
              "y": 326
            }
          },
          {
            "start": {
              "x": 368,
              "y": 326
            },
            "control1": {
              "x": 368,
              "y": 392
            },
            "control2": {
              "x": 346.4,
              "y": 462
            },
            "end": {
              "x": 260,
              "y": 462
            }
          },
          {
            "start": {
              "x": 260,
              "y": 462
            },
            "control1": {
              "x": 173.6,
              "y": 462
            },
            "control2": {
              "x": 152,
              "y": 392
            },
            "end": {
              "x": 152,
              "y": 326
            }
          },
          {
            "start": {
              "x": 152,
              "y": 326
            },
            "control1": {
              "x": 152,
              "y": 260
            },
            "control2": {
              "x": 173.6,
              "y": 190
            },
            "end": {
              "x": 260,
              "y": 190
            }
          }
        ]
      }
    ]
  },
  {
    "char": "P",
    "advance": 160,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 210,
              "y": 462
            },
            "control1": {
              "x": 206,
              "y": 360
            },
            "control2": {
              "x": 206,
              "y": 260
            },
            "end": {
              "x": 210,
              "y": 190
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 210,
              "y": 190
            },
            "control1": {
              "x": 300,
              "y": 188
            },
            "control2": {
              "x": 340,
              "y": 220
            },
            "end": {
              "x": 340,
              "y": 270
            }
          },
          {
            "start": {
              "x": 340,
              "y": 270
            },
            "control1": {
              "x": 340,
              "y": 320
            },
            "control2": {
              "x": 300,
              "y": 350
            },
            "end": {
              "x": 210,
              "y": 330
            }
          }
        ]
      }
    ]
  },
  {
    "char": "Q",
    "advance": 240,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 260,
              "y": 190
            },
            "control1": {
              "x": 346,
              "y": 190
            },
            "control2": {
              "x": 368,
              "y": 260
            },
            "end": {
              "x": 368,
              "y": 326
            }
          },
          {
            "start": {
              "x": 368,
              "y": 326
            },
            "control1": {
              "x": 368,
              "y": 392
            },
            "control2": {
              "x": 346,
              "y": 462
            },
            "end": {
              "x": 260,
              "y": 462
            }
          },
          {
            "start": {
              "x": 260,
              "y": 462
            },
            "control1": {
              "x": 174,
              "y": 462
            },
            "control2": {
              "x": 152,
              "y": 392
            },
            "end": {
              "x": 152,
              "y": 326
            }
          },
          {
            "start": {
              "x": 152,
              "y": 326
            },
            "control1": {
              "x": 152,
              "y": 260
            },
            "control2": {
              "x": 174,
              "y": 190
            },
            "end": {
              "x": 260,
              "y": 190
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 300,
              "y": 380
            },
            "control1": {
              "x": 320,
              "y": 400
            },
            "control2": {
              "x": 345,
              "y": 430
            },
            "end": {
              "x": 360,
              "y": 470
            }
          }
        ]
      }
    ]
  },
  {
    "char": "R",
    "advance": 160,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 210,
              "y": 462
            },
            "control1": {
              "x": 206,
              "y": 360
            },
            "control2": {
              "x": 206,
              "y": 260
            },
            "end": {
              "x": 210,
              "y": 190
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 210,
              "y": 190
            },
            "control1": {
              "x": 300,
              "y": 188
            },
            "control2": {
              "x": 340,
              "y": 220
            },
            "end": {
              "x": 340,
              "y": 270
            }
          },
          {
            "start": {
              "x": 340,
              "y": 270
            },
            "control1": {
              "x": 340,
              "y": 320
            },
            "control2": {
              "x": 300,
              "y": 350
            },
            "end": {
              "x": 210,
              "y": 330
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 210,
              "y": 330
            },
            "control1": {
              "x": 255,
              "y": 350
            },
            "control2": {
              "x": 305,
              "y": 420
            },
            "end": {
              "x": 345,
              "y": 462
            }
          }
        ]
      }
    ]
  },
  {
    "char": "S",
    "advance": 260,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 383.75,
              "y": 186
            },
            "control1": {
              "x": 327.5,
              "y": 142
            },
            "control2": {
              "x": 227.5,
              "y": 142
            },
            "end": {
              "x": 171.25,
              "y": 230
            }
          },
          {
            "start": {
              "x": 171.25,
              "y": 230
            },
            "control1": {
              "x": 133.75,
              "y": 307
            },
            "control2": {
              "x": 296.25,
              "y": 329
            },
            "end": {
              "x": 321.25,
              "y": 373
            }
          },
          {
            "start": {
              "x": 321.25,
              "y": 373
            },
            "control1": {
              "x": 383.75,
              "y": 450
            },
            "control2": {
              "x": 221.25,
              "y": 538
            },
            "end": {
              "x": 146.25,
              "y": 461
            }
          }
        ]
      }
    ]
  },
  {
    "char": "T",
    "advance": 190,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 160,
              "y": 190
            },
            "control1": {
              "x": 220,
              "y": 185
            },
            "control2": {
              "x": 300,
              "y": 185
            },
            "end": {
              "x": 360,
              "y": 190
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 260,
              "y": 190
            },
            "control1": {
              "x": 255,
              "y": 270
            },
            "control2": {
              "x": 255,
              "y": 380
            },
            "end": {
              "x": 260,
              "y": 480
            }
          }
        ]
      }
    ]
  },
  {
    "char": "U",
    "advance": 280,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 164,
              "y": 190
            },
            "control1": {
              "x": 158.4,
              "y": 280
            },
            "control2": {
              "x": 158.4,
              "y": 380
            },
            "end": {
              "x": 178,
              "y": 430
            }
          },
          {
            "start": {
              "x": 178,
              "y": 430
            },
            "control1": {
              "x": 206,
              "y": 500
            },
            "control2": {
              "x": 318,
              "y": 500
            },
            "end": {
              "x": 346,
              "y": 430
            }
          },
          {
            "start": {
              "x": 346,
              "y": 430
            },
            "control1": {
              "x": 365.6,
              "y": 380
            },
            "control2": {
              "x": 365.6,
              "y": 280
            },
            "end": {
              "x": 360,
              "y": 190
            }
          }
        ]
      }
    ]
  },
  {
    "char": "V",
    "advance": 250,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 148,
              "y": 190
            },
            "control1": {
              "x": 176,
              "y": 300
            },
            "control2": {
              "x": 218,
              "y": 420
            },
            "end": {
              "x": 260,
              "y": 480
            }
          },
          {
            "start": {
              "x": 260,
              "y": 480
            },
            "control1": {
              "x": 302,
              "y": 420
            },
            "control2": {
              "x": 344,
              "y": 300
            },
            "end": {
              "x": 372,
              "y": 190
            }
          }
        ]
      }
    ]
  },
  {
    "char": "W",
    "advance": 320,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 150,
              "y": 190
            },
            "control1": {
              "x": 180,
              "y": 300
            },
            "control2": {
              "x": 210,
              "y": 420
            },
            "end": {
              "x": 240,
              "y": 480
            }
          },
          {
            "start": {
              "x": 240,
              "y": 480
            },
            "control1": {
              "x": 265,
              "y": 420
            },
            "control2": {
              "x": 285,
              "y": 300
            },
            "end": {
              "x": 310,
              "y": 190
            }
          },
          {
            "start": {
              "x": 310,
              "y": 190
            },
            "control1": {
              "x": 340,
              "y": 300
            },
            "control2": {
              "x": 370,
              "y": 420
            },
            "end": {
              "x": 400,
              "y": 480
            }
          },
          {
            "start": {
              "x": 400,
              "y": 480
            },
            "control1": {
              "x": 425,
              "y": 420
            },
            "control2": {
              "x": 445,
              "y": 300
            },
            "end": {
              "x": 470,
              "y": 190
            }
          }
        ]
      }
    ]
  },
  {
    "char": "X",
    "advance": 220,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 170,
              "y": 190
            },
            "control1": {
              "x": 215,
              "y": 275
            },
            "control2": {
              "x": 305,
              "y": 385
            },
            "end": {
              "x": 350,
              "y": 480
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 170,
              "y": 480
            },
            "control1": {
              "x": 215,
              "y": 385
            },
            "control2": {
              "x": 305,
              "y": 275
            },
            "end": {
              "x": 350,
              "y": 190
            }
          }
        ]
      }
    ]
  },
  {
    "char": "Y",
    "advance": 220,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 170,
              "y": 190
            },
            "control1": {
              "x": 210,
              "y": 260
            },
            "control2": {
              "x": 235,
              "y": 310
            },
            "end": {
              "x": 260,
              "y": 330
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 350,
              "y": 190
            },
            "control1": {
              "x": 310,
              "y": 260
            },
            "control2": {
              "x": 285,
              "y": 310
            },
            "end": {
              "x": 260,
              "y": 330
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 260,
              "y": 330
            },
            "control1": {
              "x": 255,
              "y": 380
            },
            "control2": {
              "x": 255,
              "y": 430
            },
            "end": {
              "x": 260,
              "y": 480
            }
          }
        ]
      }
    ]
  },
  {
    "char": "Z",
    "advance": 220,
    "strokes": [
      {
        "segments": [
          {
            "start": {
              "x": 160,
              "y": 190
            },
            "control1": {
              "x": 220,
              "y": 185
            },
            "control2": {
              "x": 300,
              "y": 185
            },
            "end": {
              "x": 360,
              "y": 190
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 360,
              "y": 190
            },
            "control1": {
              "x": 300,
              "y": 300
            },
            "control2": {
              "x": 220,
              "y": 380
            },
            "end": {
              "x": 170,
              "y": 460
            }
          }
        ]
      },
      {
        "segments": [
          {
            "start": {
              "x": 170,
              "y": 460
            },
            "control1": {
              "x": 230,
              "y": 455
            },
            "control2": {
              "x": 300,
              "y": 455
            },
            "end": {
              "x": 360,
              "y": 460
            }
          }
        ]
      }
    ]
  },
  {
    "char": " ",
    "advance": 120,
    "strokes": []
  },
] as const;
