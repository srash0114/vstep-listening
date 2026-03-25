# Bulk Import JSON Format Guide

## Quick Start - Minimal Example

```json
{
  "exam": {
    "title": "VSTEP Listening Test 1",
    "level": "B1",
    "total_duration": 35,
    "parts": [
      {
        "part_number": 1,
        "title": "Part 1: Announcements & Short Messages",
        "audio_url": "https://example.com/part1.mp3",
        "duration": 500,
        "question_count": 8,
        "questions": [
          {
            "question_number": 1,
            "order_index": 1,
            "content": "What time will the meeting start?",
            "difficulty_level": "3-",
            "script": "Meeting postponed to 3 PM",
            "options": [
              {
                "content": "2 PM",
                "option_label": "A",
                "is_correct": false
              },
              {
                "content": "3 PM",
                "option_label": "B",
                "is_correct": true
              },
              {
                "content": "4 PM",
                "option_label": "C",
                "is_correct": false
              },
              {
                "content": "5 PM",
                "option_label": "D",
                "is_correct": false
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## Complete Format - All 3 Parts

```json
{
  "exam": {
    "title": "VSTEP Listening Test Complete",
    "description": "Full test with all parts",
    "level": "B1",
    "total_duration": 35,
    "parts": [
      {
        "part_number": 1,
        "title": "Part 1: Announcements & Short Messages",
        "description": "Listen to 8 short announcements",
        "audio_url": "https://cdn.example.com/part1.mp3",
        "duration": 500,
        "question_count": 8,
        "questions": [
          {
            "question_number": 1,
            "order_index": 1,
            "content": "What time will the meeting start?",
            "difficulty_level": "3-",
            "script": "Meeting postponed to 3 PM",
            "options": [
              {
                "content": "2 PM",
                "option_label": "A",
                "is_correct": false
              },
              {
                "content": "3 PM",
                "option_label": "B",
                "is_correct": true
              },
              {
                "content": "4 PM",
                "option_label": "C",
                "is_correct": false
              },
              {
                "content": "5 PM",
                "option_label": "D",
                "is_correct": false
              }
            ]
          }
          // Add 7 more questions for Part 1 (total 8)
        ]
      },
      {
        "part_number": 2,
        "title": "Part 2: Long Conversations",
        "description": "Listen to 3 conversations with 4 questions each",
        "audio_url": "https://cdn.example.com/part2.mp3",
        "duration": 800,
        "question_count": 12,
        "passages": [
          {
            "title": "Conversation 1: Hotel Booking",
            "script": "Staff: Welcome to Hilton...",
            "audio_url": "https://cdn.example.com/conversation1.mp3",
            "passage_order": 1,
            "questions": [
              {
                "question_number": 9,
                "order_index": 1,
                "content": "Why is the customer calling?",
                "difficulty_level": "3",
                "script": "Background context here",
                "options": [
                  {
                    "content": "To make a reservation",
                    "option_label": "A",
                    "is_correct": true
                  },
                  {
                    "content": "To complain about service",
                    "option_label": "B",
                    "is_correct": false
                  },
                  {
                    "content": "To ask directions",
                    "option_label": "C",
                    "is_correct": false
                  },
                  {
                    "content": "To cancel a booking",
                    "option_label": "D",
                    "is_correct": false
                  }
                ]
              }
              // Add 3 more questions for this conversation
            ]
          },
          // Add 2 more conversations (total 3)
        ]
      },
      {
        "part_number": 3,
        "title": "Part 3: Lectures & Talks",
        "description": "Listen to 3 academic lectures with 5 questions each",
        "audio_url": "https://cdn.example.com/part3.mp3",
        "duration": 1200,
        "question_count": 15,
        "passages": [
          {
            "title": "Lecture 1: Climate Change",
            "script": "Professor: Today we'll discuss climate change...",
            "audio_url": "https://cdn.example.com/lecture1.mp3",
            "passage_order": 1,
            "questions": [
              {
                "question_number": 21,
                "order_index": 1,
                "content": "What is the main topic of this lecture?",
                "difficulty_level": "3-",
                "script": "Context from the lecture",
                "options": [
                  {
                    "content": "Climate change",
                    "option_label": "A",
                    "is_correct": true
                  },
                  {
                    "content": "Environmental policy",
                    "option_label": "B",
                    "is_correct": false
                  },
                  {
                    "content": "Global economy",
                    "option_label": "C",
                    "is_correct": false
                  },
                  {
                    "content": "Scientific research",
                    "option_label": "D",
                    "is_correct": false
                  }
                ]
              }
              // Add 4 more questions for this lecture
            ]
          }
          // Add 2 more lectures (total 3)
        ]
      }
    ]
  }
}
```

---

## Field Definitions

### Exam Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | ✓ | Test title (e.g., "VSTEP Listening Test 1") |
| description | string | No | Test description |
| level | string | ✓ | Difficulty level (B1, B2, C1, etc.) |
| total_duration | number | ✓ | Total exam duration in minutes (35 for VSTEP) |
| parts | array | ✓ | Array of 1-3 parts |

### Part Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| part_number | number | ✓ | Part number (1, 2, or 3) |
| title | string | ✓ | Part title |
| description | string | No | Part description |
| audio_url | string | ✓ | URL to part's main audio file |
| duration | number | ✓ | Part duration in seconds |
| question_count | number | ✓ | Total questions in part |
| questions | array | No* | Questions (for Part 1 without passages) |
| passages | array | No* | Passages with questions (for Parts 2 & 3) |

*Part 1 uses `questions` directly. Parts 2 & 3 use `passages` which contain `questions`.

### Passage Object (Part 2 & 3)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | ✓ | Passage title (conversation/lecture name) |
| script | string | ✓ | Full text transcription of audio |
| audio_url | string | ✓ | URL to passage's audio file |
| passage_order | number | ✓ | Order within part (1-3) |
| questions | array | ✓ | Array of questions for this passage |

### Question Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| question_number | number | ✓ | Question number (1-35 overall) |
| order_index | number | ✓ | Order within passage/part |
| content | string | ✓ | Question text |
| difficulty_level | string | ✓ | Difficulty (3-, 3, 3+, 4, 4+, 5-, 5) |
| script | string | No | Additional context/script for question |
| options | array | ✓ | Array of 4 options |

### Option Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| content | string | ✓ | Option text (answer choice) |
| option_label | string | ✓ | Option label (A, B, C, D) |
| is_correct | boolean | ✓ | Mark correct answer as true |

---

## VSTEP Test Structure

### Part 1: Announcements & Short Messages
- **Questions**: 8
- **Duration**: ~5 minutes
- **Structure**: 8 separate questions (no passages)
- **Audio**: One combined audio file or individual clips

### Part 2: Long Conversations
- **Questions**: 12 (3 conversations × 4 questions each)
- **Duration**: ~12 minutes
- **Structure**: 3 passages (conversations), each with 4 questions
- **Audio**: 3 separate conversation files

### Part 3: Lectures & Talks
- **Questions**: 15 (3 lectures × 5 questions each)
- **Duration**: ~18 minutes
- **Structure**: 3 passages (lectures), each with 5 questions
- **Audio**: 3 separate lecture files

---

## JSON Validation Rules

✓ **Must Have Exactly**:
- 1 exam object
- 4 options per question
- Exactly 1 `is_correct: true` per question
- Valid URLs for all audio files

✓ **Recommended**:
- 8 questions in Part 1
- 12 questions in Part 2 (3 passages × 4 questions)
- 15 questions in Part 3 (3 lectures × 5 questions)
- Total: 35 questions

✓ **Requirements**:
- All fields are non-empty strings/numbers where required
- `is_correct` must be strictly boolean (true/false, not 1/0)
- `question_number` must be sequential (1-35)
- `order_index` must be sequential within passage (1-4 or 1-5)
- `passage_order` must be sequential (1-3)

---

## Common Mistakes

❌ **Incorrect** - Missing questions in Part 1:
```json
"questions": []  // Empty!
```

✓ **Correct**:
```json
"questions": [
  {
    "question_number": 1,
    "content": "What...",
    // ... complete question
  }
]
```

---

❌ **Incorrect** - Multiple correct answers:
```json
"options": [
  {"content": "A", "is_correct": true},
  {"content": "B", "is_correct": true}  // Only one should be true!
]
```

✓ **Correct**:
```json
"options": [
  {"content": "A", "is_correct": false},
  {"content": "B", "is_correct": true},  // Only one true
  {"content": "C", "is_correct": false},
  {"content": "D", "is_correct": false}
]
```

---

❌ **Incorrect** - Using passages in Part 1:
```json
{
  "part_number": 1,
  "passages": [...]  // Part 1 should use "questions" directly!
}
```

✓ **Correct** - Part 1 direct questions:
```json
{
  "part_number": 1,
  "questions": [...]  // Direct questions, no passages
}
```

---

## How to Use

1. Go to `/admin/import`
2. Choose one of these methods:
   - **Upload**: Click "Upload JSON File" and select your JSON file
   - **Paste**: Copy this template, fill in your data, paste in text area
3. Click "Import Exam"
4. Review the success message with your Exam ID

---

## Notes

- All audio URLs should be accessible and publicly available
- URLs are stored as-is in the database
- You can update individual questions later via the bulk update endpoint
- Import creates the complete structure in one request (atomic operation)
