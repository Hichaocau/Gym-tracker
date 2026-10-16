"""Build src/data/exercises.ts from free-exercise-db (Unlicense) with Vietnamese names.

usage: python3 -I scripts/gen_exercises.py <free-exercise-db exercises.json> src/data/exercises.ts scripts/exercise-vi/*.json
"""
import json
import sys

CURATED = {
    "Ngực": [
        ("Barbell_Bench_Press_-_Medium_Grip", "Đẩy ngực tạ đòn"),
        ("Barbell_Incline_Bench_Press_-_Medium_Grip", "Đẩy ngực dốc lên tạ đòn"),
        ("Decline_Barbell_Bench_Press", "Đẩy ngực dốc xuống tạ đòn"),
        ("Dumbbell_Bench_Press", "Đẩy ngực tạ đơn"),
        ("Incline_Dumbbell_Press", "Đẩy ngực dốc lên tạ đơn"),
        ("Decline_Dumbbell_Bench_Press", "Đẩy ngực dốc xuống tạ đơn"),
        ("Dumbbell_Flyes", "Bay ngực tạ đơn"),
        ("Incline_Dumbbell_Flyes", "Bay ngực dốc lên tạ đơn"),
        ("Cable_Crossover", "Ép ngực cáp chéo"),
        ("Low_Cable_Crossover", "Ép ngực cáp thấp"),
        ("Incline_Cable_Flye", "Ép ngực cáp ghế dốc"),
        ("Butterfly", "Ép ngực máy (Pec deck)"),
        ("Machine_Chest_Fly", "Chest fly máy (tay cầm)"),
        ("Machine_Bench_Press", "Đẩy ngực máy"),
        ("Leverage_Incline_Chest_Press", "Đẩy ngực dốc lên máy"),
        ("Smith_Machine_Bench_Press", "Đẩy ngực Smith"),
        ("Smith_Machine_Incline_Bench_Press", "Đẩy ngực dốc lên Smith"),
        ("Pushups", "Hít đất"),
        ("Push-Up_Wide", "Hít đất tay rộng"),
        ("Incline_Push-Up", "Hít đất tay chống cao"),
        ("Decline_Push-Up", "Hít đất chân kê cao"),
        ("Dips_-_Chest_Version", "Dips ngực"),
        ("Bent-Arm_Dumbbell_Pullover", "Pullover tạ đơn"),
    ],
    "Lưng": [
        ("Pullups", "Kéo xà đơn"),
        ("Chin-Up", "Kéo xà tay ngửa"),
        ("Wide-Grip_Lat_Pulldown", "Kéo cáp xuống tay rộng"),
        ("Close-Grip_Front_Lat_Pulldown", "Kéo cáp xuống tay hẹp"),
        ("V-Bar_Pulldown", "Kéo cáp xuống tay cầm V"),
        ("Underhand_Cable_Pulldowns", "Kéo cáp xuống tay ngửa"),
        ("Straight-Arm_Pulldown", "Kéo cáp tay thẳng"),
        ("Seated_Cable_Rows", "Chèo cáp ngồi"),
        ("Bent_Over_Barbell_Row", "Chèo tạ đòn"),
        ("Reverse_Grip_Bent-Over_Rows", "Chèo tạ đòn tay ngửa"),
        ("One-Arm_Dumbbell_Row", "Chèo tạ đơn một tay"),
        ("Bent_Over_Two-Dumbbell_Row", "Chèo hai tạ đơn"),
        ("T-Bar_Row_with_Handle", "Chèo T-bar"),
        ("Leverage_High_Row", "Chèo máy kéo cao"),
        ("Leverage_Iso_Row", "Chèo máy"),
        ("Inverted_Row", "Chèo ngược xà thấp"),
        ("Barbell_Deadlift", "Deadlift tạ đòn"),
        ("Sumo_Deadlift", "Deadlift sumo"),
        ("Trap_Bar_Deadlift", "Deadlift tạ lục giác"),
        ("Hyperextensions_Back_Extensions", "Gập lưng dưới (Hyperextension)"),
        ("Good_Morning", "Good morning"),
    ],
    "Vai": [
        ("Barbell_Shoulder_Press", "Đẩy vai tạ đòn ngồi"),
        ("Standing_Military_Press", "Đẩy vai tạ đòn đứng"),
        ("Dumbbell_Shoulder_Press", "Đẩy vai tạ đơn"),
        ("Arnold_Dumbbell_Press", "Arnold press"),
        ("Machine_Shoulder_Military_Press", "Đẩy vai máy"),
        ("Smith_Machine_Overhead_Shoulder_Press", "Đẩy vai Smith"),
        ("Side_Lateral_Raise", "Dang tạ đơn ngang"),
        ("Cable_Seated_Lateral_Raise", "Dang cáp ngang"),
        ("Front_Dumbbell_Raise", "Nâng tạ đơn trước mặt"),
        ("Front_Plate_Raise", "Nâng bánh tạ trước mặt"),
        ("Reverse_Flyes", "Bay vai sau tạ đơn"),
        ("Reverse_Machine_Flyes", "Bay vai sau máy"),
        ("Cable_Rear_Delt_Fly", "Bay vai sau cáp"),
        ("Seated_Bent-Over_Rear_Delt_Raise", "Dang vai sau ngồi cúi"),
        ("Face_Pull", "Face pull"),
        ("Upright_Barbell_Row", "Kéo tạ đòn dọc thân"),
        ("Standing_Dumbbell_Upright_Row", "Kéo tạ đơn dọc thân"),
        ("Barbell_Shrug", "Nhún vai tạ đòn"),
        ("Dumbbell_Shrug", "Nhún vai tạ đơn"),
    ],
    "Tay": [
        ("Barbell_Curl", "Cuốn tạ đòn"),
        ("EZ-Bar_Curl", "Cuốn thanh EZ"),
        ("Dumbbell_Bicep_Curl", "Cuốn tạ đơn"),
        ("Dumbbell_Alternate_Bicep_Curl", "Cuốn tạ đơn xen kẽ"),
        ("Hammer_Curls", "Cuốn búa"),
        ("Incline_Dumbbell_Curl", "Cuốn tạ đơn ghế dốc"),
        ("Concentration_Curls", "Cuốn tập trung"),
        ("Preacher_Curl", "Cuốn ghế Scott"),
        ("Machine_Preacher_Curls", "Cuốn ghế Scott máy"),
        ("Standing_Biceps_Cable_Curl", "Cuốn cáp"),
        ("Cable_Hammer_Curls_-_Rope_Attachment", "Cuốn búa cáp dây"),
        ("Spider_Curl", "Spider curl"),
        ("Zottman_Curl", "Zottman curl"),
        ("Reverse_Barbell_Curl", "Cuốn ngược tạ đòn"),
        ("Palms-Up_Barbell_Wrist_Curl_Over_A_Bench", "Cuốn cổ tay"),
        ("Triceps_Pushdown", "Ép tay sau cáp"),
        ("Triceps_Pushdown_-_Rope_Attachment", "Ép tay sau cáp dây"),
        ("Triceps_Pushdown_-_V-Bar_Attachment", "Ép tay sau tay cầm V"),
        ("Triceps_Overhead_Extension_with_Rope", "Duỗi tay sau qua đầu cáp"),
        ("EZ-Bar_Skullcrusher", "Skull crusher thanh EZ"),
        ("Lying_Triceps_Press", "Skull crusher tạ đòn"),
        ("Standing_Dumbbell_Triceps_Extension", "Duỗi tay sau tạ đơn qua đầu"),
        ("Tricep_Dumbbell_Kickback", "Kickback tay sau"),
        ("Machine_Triceps_Extension", "Duỗi tay sau máy"),
        ("Close-Grip_Barbell_Bench_Press", "Đẩy ngực tay hẹp"),
        ("Dips_-_Triceps_Version", "Dips tay sau"),
        ("Bench_Dips", "Dips ghế"),
        ("Push-Ups_-_Close_Triceps_Position", "Hít đất tay hẹp"),
    ],
    "Chân": [
        ("Barbell_Squat", "Squat tạ đòn"),
        ("Barbell_Full_Squat", "Squat sâu tạ đòn"),
        ("Front_Squat_Clean_Grip", "Front squat"),
        ("Goblet_Squat", "Goblet squat"),
        ("Dumbbell_Squat", "Squat tạ đơn"),
        ("Bodyweight_Squat", "Squat không tạ"),
        ("Freehand_Jump_Squat", "Squat bật nhảy"),
        ("Hack_Squat", "Hack squat"),
        ("Smith_Machine_Squat", "Squat Smith"),
        ("Leg_Press", "Đạp đùi"),
        ("Leg_Extensions", "Đá đùi trước máy"),
        ("Lying_Leg_Curls", "Móc đùi sau nằm"),
        ("Seated_Leg_Curl", "Móc đùi sau ngồi"),
        ("Romanian_Deadlift", "Romanian deadlift (RDL)"),
        ("Stiff-Legged_Dumbbell_Deadlift", "Deadlift chân thẳng tạ đơn"),
        ("Dumbbell_Lunges", "Lunge tạ đơn"),
        ("Dumbbell_Rear_Lunge", "Lunge lùi tạ đơn"),
        ("Barbell_Walking_Lunge", "Lunge đi bộ tạ đòn"),
        ("Bodyweight_Walking_Lunge", "Lunge đi bộ không tạ"),
        ("Split_Squat_with_Dumbbells", "Split squat tạ đơn"),
        ("Standing_Calf_Raises", "Nhón bắp chân đứng"),
        ("Seated_Calf_Raise", "Nhón bắp chân ngồi"),
        ("Calf_Press_On_The_Leg_Press_Machine", "Nhón bắp chân máy đạp đùi"),
        ("Thigh_Adductor", "Kẹp đùi trong máy"),
    ],
    "Mông": [
        ("Barbell_Hip_Thrust", "Hip thrust tạ đòn"),
        ("Barbell_Glute_Bridge", "Glute bridge tạ đòn"),
        ("Butt_Lift_Bridge", "Cầu mông"),
        ("Single_Leg_Glute_Bridge", "Cầu mông một chân"),
        ("Glute_Kickback", "Đá mông sau"),
        ("One-Legged_Cable_Kickback", "Đá mông cáp"),
        ("Thigh_Abductor", "Dạng đùi máy"),
        ("Plie_Dumbbell_Squat", "Squat sumo tạ đơn"),
        ("Dumbbell_Step_Ups", "Bước bục tạ đơn"),
        ("Barbell_Step_Ups", "Bước bục tạ đòn"),
    ],
    "Bụng": [
        ("Crunches", "Gập bụng"),
        ("Cable_Crunch", "Gập bụng cáp"),
        ("Ab_Crunch_Machine", "Gập bụng máy"),
        ("Reverse_Crunch", "Gập bụng ngược"),
        ("Oblique_Crunches_-_On_The_Floor", "Gập bụng chéo"),
        ("Air_Bike", "Gập bụng đạp xe"),
        ("Sit-Up", "Ngồi dậy (sit-up)"),
        ("Plank", "Plank"),
        ("Side_Bridge", "Plank nghiêng"),
        ("Russian_Twist", "Russian twist"),
        ("Flat_Bench_Lying_Leg_Raise", "Nâng chân nằm"),
        ("Hanging_Leg_Raise", "Treo xà nâng chân"),
        ("Ab_Roller", "Lăn bụng"),
        ("Mountain_Climbers", "Leo núi (mountain climber)"),
    ],
    "Cardio": [
        ("Running_Treadmill", "Chạy máy"),
        ("Jogging_Treadmill", "Chạy chậm máy"),
        ("Walking_Treadmill", "Đi bộ máy"),
        ("Trail_Running_Walking", "Chạy bộ ngoài trời"),
        ("Bicycling_Stationary", "Đạp xe tại chỗ"),
        ("Bicycling", "Đạp xe ngoài trời"),
        ("Rowing_Stationary", "Máy chèo thuyền"),
        ("Elliptical_Trainer", "Máy elliptical"),
        ("Stairmaster", "Máy leo cầu thang"),
        ("Rope_Jumping", "Nhảy dây"),
    ],
}

TIMED = {"Plank", "Side_Bridge", "Mountain_Climbers"}

# Exercises that are not in free-exercise-db, written by hand.
# Their images live in public/exercises/<id>/0.svg (start) and 1.svg (end).
EXTRA = {
    "Machine_Chest_Fly": {
        "name": "Machine Chest Fly",
        "equipment": "machine",
        "images": ["/exercises/Machine_Chest_Fly/0.svg", "/exercises/Machine_Chest_Fly/1.svg"],
        "instructions": [
            "Chỉnh ghế sao cho tay cầm ngang tầm ngực khi ngồi. Ngồi áp lưng vào đệm, hai chân đặt vững trên sàn.",
            "Nắm hai tay cầm, khuỷu tay hơi cong và giữ nguyên góc này suốt bài. Ưỡn ngực, hạ vai và kéo nhẹ vai ra sau. Đây là tư thế bắt đầu.",
            "Thở ra, siết ngực để ép hai tay cầm vào nhau trước ngực theo đường vòng cung. Giữ một giây ở điểm cuối và siết chặt ngực.",
            "Hít vào, từ từ mở tay về tư thế bắt đầu đến khi ngực căng nhẹ. Không để tạ đập vào nhau và không mở tay ra quá sau vai.",
            "Lặp lại đủ số rep. Chọn mức tạ vừa phải để kiểm soát động tác, dùng lực ngực chứ không dùng tay đẩy.",
        ],
    },
}

# Extra search terms (matched without diacritics) for names people actually use at the gym.
ALIASES = {
    "Butterfly": ["chest fly", "chess fly", "pec fly", "pec deck", "ép ngực máy", "bay ngực máy"],
    "Machine_Chest_Fly": ["chest fly", "chess fly", "pec fly", "pec deck", "ép ngực máy", "bay ngực máy", "fly máy"],
    "Cable_Crossover": ["cable fly", "chest fly cáp"],
    "Dumbbell_Flyes": ["chest fly", "dumbbell fly"],
}

EQUIPMENT_VI = {
    "barbell": "Tạ đòn", "dumbbell": "Tạ đơn", "cable": "Cáp", "machine": "Máy",
    "body only": "Không dụng cụ", "e-z curl bar": "Thanh EZ", "other": "Khác",
    "kettlebells": "Tạ ấm", "bands": "Dây kháng lực",
}


def load_translations(paths):
    vi = {}
    for p in paths:
        vi.update(json.load(open(p, encoding="utf-8")))
    return vi


def main(src, out, *translation_files):
    by_id = {x["id"]: x for x in json.load(open(src, encoding="utf-8"))}
    vi_steps = load_translations(translation_files)
    rows, missing = [], []
    for group, items in CURATED.items():
        for ex_id, vi in items:
            x = by_id.get(ex_id) or EXTRA.get(ex_id)
            if not x:
                missing.append(ex_id)
                continue
            if group == "Cardio":
                kind = "cardio"
            elif ex_id in TIMED:
                kind = "time"
            elif x["equipment"] in ("body only", None):
                kind = "bodyweight"
            else:
                kind = "weight"
            rows.append({
                "id": ex_id,
                "name": vi,
                "en": x["name"],
                "group": group,
                "kind": kind,
                "equipment": EQUIPMENT_VI.get(x["equipment"] or "", ""),
                "image": x["images"][0] if x["images"] else "",
                "instructions": vi_steps.get(ex_id) or x["instructions"],
                **({"aliases": ALIASES[ex_id]} if ex_id in ALIASES else {}),
            })
            if translation_files and ex_id not in vi_steps and ex_id not in EXTRA:
                missing.append(f"{ex_id} (chưa dịch)")
    with open(out, "w", encoding="utf-8") as f:
        f.write("// Generated from free-exercise-db (https://github.com/yuhonas/free-exercise-db, Unlicense).\n")
        f.write("// Vietnamese names and instructions translated from the original. Do not edit by hand; regenerate instead.\n")
        f.write("import type { LibraryExercise } from '../types'\n\n")
        f.write("export const EXERCISE_LIBRARY: LibraryExercise[] = ")
        f.write(json.dumps(rows, ensure_ascii=False, indent=1))
        f.write("\n")
    print(f"wrote {len(rows)} exercises; missing: {missing}")


if __name__ == "__main__":
    main(*sys.argv[1:])
