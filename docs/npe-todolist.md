# New Player Experience (NPE) To-Do List

## 1. Account Creation
- [ ] Implement sign-up and guest entry flow
- [ ] Welcome message (no forced tutorial)

## 2. Starter Mask Selection
- [ ] Show starter mask selection screen
- [ ] Tooltip: “Pick your first mask! Each mask has unique powers and colors.”
- [ ] On hover/click: Show mask rarity, color, and description

## 3. First Pack Opening
- [ ] Trigger first pack opening after mask selection
- [ ] Tooltip: “Open your first pack to discover more masks!”
- [ ] After opening: Tooltip for new/duplicate mask mechanics

## 4. Collection Page
- [ ] Tooltip: “View all your masks here. Click a mask to see details and upgrade options.”
- [ ] On first duplicate: Tooltip for Protodermis and upgrades

## 5. Equip Screen
- [ ] Tooltip: “Equip a mask to your Toa or Turaga slot to activate its buff.”
- [ ] On first equip: Tooltip for buffs and combinations

## 6. Pack Timer/Progress
- [ ] Tooltip: “A new pack will be ready in X minutes. Come back to collect more!”

## 7. Ongoing Tooltips & Help
- [ ] “?” icons or highlights for new features as they unlock
- [ ] “How to Play” always available in menu

## 8. Tooltip System Implementation
- [ ] Choose or build a tooltip library/component
- [ ] Store tooltip state (shown/dismissed) per user
- [ ] Trigger tooltips contextually as features unlock
- [ ] Allow users to dismiss or revisit tips

---

**References:**
- See docs/spec.md, docs/design.md, docs/UI.md for details
- Conversation notes: Focus on contextual, progressive tooltips (no forced slideshow)
