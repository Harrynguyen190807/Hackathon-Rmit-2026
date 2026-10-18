#!/usr/bin/env bash
# ==============================================================================
# Script: symlink_skills.sh
# Description: Tự động tạo symlink chuyển toàn bộ skills từ project này
#              vào thư mục cấu hình global của Antigravity (~/.gemini/config/skills).
# ==============================================================================

set -euo pipefail

# Màu hiển thị
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Xác định thư mục gốc của project
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_SKILLS_DIR="$PROJECT_ROOT/.agents/skills"
TARGET_GLOBAL_DIR="${HOME}/.gemini/config/skills"

# Kích hoạt native symlink nếu chạy trên Git Bash (Windows)
export MSYS="winsymlinks:nativestrict" 2>/dev/null || true


echo -e "${BLUE}=== Antigravity Global Skills Symlinker ===${NC}"
echo -e "Thư mục nguồn : ${YELLOW}$SOURCE_SKILLS_DIR${NC}"
echo -e "Thư mục đích   : ${YELLOW}$TARGET_GLOBAL_DIR${NC}"
echo ""

# Kiểm tra thư mục nguồn
if [ ! -d "$SOURCE_SKILLS_DIR" ]; then
    echo -e "${RED}[LỖI] Không tìm thấy thư mục: $SOURCE_SKILLS_DIR${NC}"
    exit 1
fi

# Tạo thư mục global skills nếu chưa có
mkdir -p "$TARGET_GLOBAL_DIR"

# Duyệt qua từng skill trong .agents/skills
count=0
for skill_path in "$SOURCE_SKILLS_DIR"/*; do
    if [ -d "$skill_path" ]; then
        skill_name="$(basename "$skill_path")"
        target_path="$TARGET_GLOBAL_DIR/$skill_name"

        # Kiểm tra file SKILL.md hợp lệ
        if [ ! -f "$skill_path/SKILL.md" ]; then
            echo -e "${YELLOW}[BỎ QUA] $skill_name (không có SKILL.md)${NC}"
            continue
        fi

        # Nếu đích đã tồn tại (symlink hoặc thư mục)
        if [ -L "$target_path" ] || [ -e "$target_path" ]; then
            echo -e "${YELLOW}[CẬP NHẬT] Đã xóa liên kết cũ của: $skill_name${NC}"
            rm -rf "$target_path"
        fi

        # Tạo symlink
        # Hỗ trợ Git Bash trên Windows: MSYS=winsymlinks:nativestrict nếu cần native symlink
        ln -s "$skill_path" "$target_path"
        echo -e "${GREEN}[THÀNH CÔNG] Linked: $skill_name -> $target_path${NC}"
        count=$((count + 1))
    fi
done

echo ""
echo -e "${GREEN}=== Hoàn tất! Đã liên kết $count skills vào Antigravity Global Config ===${NC}"
echo -e "Bây giờ bạn có thể mở bất kỳ dự án nào, Antigravity đều sẽ tự động nhận diện các skills này."
