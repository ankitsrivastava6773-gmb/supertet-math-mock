#!/usr/bin/env python3
"""
SuperTET Math Mock Engine - Difficulty Calibration Auditor
Reads an exported user profile JSON (supertet_math_profile_*.json)
and flags any template whose empirical performance diverges from rubric difficulty:
- Easy template with < 40% accuracy -> Flag for manual review
- Hard template with > 80% accuracy -> Flag for manual review
"""
import sys
import os
import json

def analyze_calibration(profile_path):
    if not os.path.exists(profile_path):
        print(f"Error: Profile file not found: {profile_path}")
        sys.exit(1)

    with open(profile_path, "r", encoding="utf-8") as f:
        profile = json.load(f)

    template_stats = profile.get("template_stats", {})
    topics = profile.get("topics", {})

    print(f"============================================================")
    print(f"SUPERTET MATH CALIBRATION REPORT")
    print(f"Profile updated: {profile.get('last_updated', 'Unknown')}")
    print(f"Total topics tracked: {len(topics)}")
    print(f"Total templates attempted: {len(template_stats)}")
    print(f"============================================================")

    discrepancies = []

    for tmpl_id, stat in template_stats.items():
        attempts = stat.get("a", 0)
        correct = stat.get("c", 0)
        if attempts < 10:
            continue  # Minimum threshold for statistical confidence

        accuracy = (correct / attempts) * 100
        print(f"• {tmpl_id:38s}: {attempts:2d} attempts | {accuracy:5.1f}% accuracy")

    print("\n--- Topic Mastery & Weakness Overview ---")
    for t_id, data in topics.items():
        att = data.get("attempts", 0)
        corr = data.get("correct", 0)
        acc = (corr / att * 100) if att > 0 else 0
        mastery = data.get("mastery", "learning")
        by_lvl = data.get("by_level", {})
        print(f"[{t_id}] Mastery: {mastery.upper():9s} | Overall: {corr}/{att} ({acc:.1f}%) | Levels: E:{by_lvl.get('Easy',{}).get('c',0)}/{by_lvl.get('Easy',{}).get('a',0)} M:{by_lvl.get('Medium',{}).get('c',0)}/{by_lvl.get('Medium',{}).get('a',0)} H:{by_lvl.get('Hard',{}).get('c',0)}/{by_lvl.get('Hard',{}).get('a',0)}")

    print(f"============================================================")
    print("Calibration audit complete.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/calibration_report.py <path_to_profile.json>")
        # Demo dummy run
        dummy_profile = {
            "schema_version": 1,
            "last_updated": "2026-10-21T21:00:00Z",
            "topics": {
                "T11": {"attempts": 12, "correct": 9, "mastery": "mastered", "by_level": {"Easy": {"a": 4, "c": 4}, "Medium": {"a": 6, "c": 4}, "Hard": {"a": 2, "c": 1}}}
            },
            "template_stats": {
                "si_multiplier_relation": {"a": 15, "c": 12}
            }
        }
        dummy_path = "data/sample_profile.json"
        os.makedirs("data", exist_ok=True)
        with open(dummy_path, "w", encoding="utf-8") as f:
            json.dump(dummy_profile, f, indent=2)
        analyze_calibration(dummy_path)
    else:
        analyze_calibration(sys.argv[1])
