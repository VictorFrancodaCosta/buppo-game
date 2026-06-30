extends Control

const ACTIONS := ["ATAQUE", "BLOQUEIO", "DESCANSAR", "TREINAR", "DESARMAR"]
const DECK_TEMPLATE := {
	"ATAQUE": 10,
	"BLOQUEIO": 8,
	"DESCANSAR": 4,
	"TREINAR": 4,
	"DESARMAR": 4,
}
const CARD_COLORS := {
	"ATAQUE": Color("#d94b4b"),
	"BLOQUEIO": Color("#3f7edb"),
	"DESCANSAR": Color("#4fbf72"),
	"TREINAR": Color("#8f6bdc"),
	"DESARMAR": Color("#d7aa35"),
}
const CARD_DESCRIPTIONS := {
	"ATAQUE": "Dano igual ao nivel. Ganha XP extra se o inimigo descansar.",
	"BLOQUEIO": "Anula ataque e contra-ataca.",
	"DESCANSAR": "Cura 2 HP, ou 3 HP se nao sofrer dano.",
	"TREINAR": "Move a carta do topo do deck para XP.",
	"DESARMAR": "Bloqueia uma acao inimiga no proximo turno.",
}
const CARD_IMAGE_PATHS := {
	"ATAQUE": "res://assets/img/carta_ataque_cavaleiro.png",
	"BLOQUEIO": "res://assets/img/carta_bloqueio_cavaleiro.png",
	"DESCANSAR": "res://assets/img/carta_descansar_cavaleiro.png",
	"TREINAR": "res://assets/img/carta_treinar_cavaleiro.png",
	"DESARMAR": "res://assets/img/carta_desarmar_cavaleiro.png",
}
const CARD_SIZE := Vector2(210, 304)
const TABLE_CARD_SIZE := Vector2(286, 392)

var rng := RandomNumberGenerator.new()
var player := {}
var enemy := {}
var turn_count := 1
var resolving := false
var selected_disarm_card_index := -1
var player_history: Array[String] = []

var enemy_panel: PanelContainer
var player_panel: PanelContainer
var enemy_status_label: Label
var player_status_label: Label
var log_label: RichTextLabel
var hand_row: Control
var center_label: Label
var action_buttons: HBoxContainer
var overlay_panel: PanelContainer
var enemy_slot: PanelContainer
var player_slot: PanelContainer
var table_layer: Control
var enemy_xp_board: PanelContainer
var player_xp_board: PanelContainer

func _ready() -> void:
	rng.randomize()
	_build_ui()
	start_new_match()

func _build_ui() -> void:
	var bg := TextureRect.new()
	bg.texture = _image_texture("res://assets/img/mesa_cavaleiro.png")
	bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	bg.stretch_mode = TextureRect.STRETCH_SCALE
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var title := Label.new()
	title.text = ""
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 22)
	title.add_theme_color_override("font_color", Color("#ffd76a"))
	add_child(title)

	enemy_xp_board = _create_xp_board()
	enemy_xp_board.position = Vector2(62, 26)
	enemy_xp_board.size = Vector2(650, 220)
	add_child(enemy_xp_board)

	enemy_status_label = _create_big_status_label()
	enemy_status_label.position = Vector2(780, 74)
	enemy_status_label.size = Vector2(250, 120)
	add_child(enemy_status_label)

	table_layer = Control.new()
	table_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(table_layer)

	center_label = Label.new()
	center_label.text = ""
	center_label.position = Vector2(0, 260)
	center_label.size = Vector2(1080, 48)
	center_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	center_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	center_label.add_theme_font_size_override("font_size", 26)
	center_label.add_theme_color_override("font_color", Color("#f8e7b0"))
	add_child(center_label)

	enemy_slot = _create_slot("CARTA DO INIMIGO")
	enemy_slot.position = Vector2(612, 586)
	enemy_slot.size = TABLE_CARD_SIZE
	add_child(enemy_slot)

	player_slot = _create_slot("SUA CARTA")
	player_slot.position = Vector2(202, 586)
	player_slot.size = TABLE_CARD_SIZE
	add_child(player_slot)

	log_label = RichTextLabel.new()
	log_label.visible = false
	log_label.fit_content = false
	log_label.scroll_active = true
	log_label.bbcode_enabled = true
	log_label.add_theme_font_size_override("normal_font_size", 15)
	log_label.add_theme_color_override("default_color", Color("#ead9b5"))
	add_child(log_label)

	player_status_label = _create_big_status_label()
	player_status_label.position = Vector2(50, 1310)
	player_status_label.size = Vector2(250, 120)
	add_child(player_status_label)

	player_xp_board = _create_xp_board()
	player_xp_board.position = Vector2(366, 1270)
	player_xp_board.size = Vector2(650, 220)
	add_child(player_xp_board)

	var hand_title := Label.new()
	hand_title.text = ""
	hand_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hand_title.add_theme_font_size_override("font_size", 22)
	hand_title.add_theme_color_override("font_color", Color("#ffd76a"))
	add_child(hand_title)

	hand_row = Control.new()
	hand_row.position = Vector2(0, 1582)
	hand_row.size = Vector2(1080, 338)
	add_child(hand_row)

	action_buttons = HBoxContainer.new()
	action_buttons.position = Vector2(70, 1508)
	action_buttons.size = Vector2(940, 58)
	action_buttons.alignment = BoxContainer.ALIGNMENT_CENTER
	action_buttons.add_theme_constant_override("separation", 5)
	action_buttons.visible = false
	add_child(action_buttons)

	overlay_panel = PanelContainer.new()
	overlay_panel.visible = false
	overlay_panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay_panel.add_theme_stylebox_override("panel", _style(Color(0, 0, 0, 0.82), Color("#ffd76a"), 3, 0))
	add_child(overlay_panel)

func _create_unit_panel(unit_name: String) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(0, 96)
	panel.add_theme_stylebox_override("panel", _style(Color("#302218"), Color("#b98645"), 4, 18))

	var box := VBoxContainer.new()
	box.name = "UnitBox"
	box.add_theme_constant_override("separation", 8)
	panel.add_child(box)

	var name := Label.new()
	name.name = "Name"
	name.text = unit_name
	name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name.add_theme_font_size_override("font_size", 18)
	name.add_theme_color_override("font_color", Color("#ffd76a"))
	box.add_child(name)

	var stats := Label.new()
	stats.name = "Stats"
	stats.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	stats.add_theme_font_size_override("font_size", 14)
	stats.add_theme_color_override("font_color", Color("#ffffff"))
	box.add_child(stats)

	var xp := Label.new()
	xp.name = "XP"
	xp.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	xp.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	xp.add_theme_font_size_override("font_size", 12)
	xp.add_theme_color_override("font_color", Color("#d6c4a2"))
	box.add_child(xp)

	var mastery := Label.new()
	mastery.name = "Mastery"
	mastery.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	mastery.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	mastery.add_theme_font_size_override("font_size", 12)
	mastery.add_theme_color_override("font_color", Color("#bce8ff"))
	box.add_child(mastery)

	return panel

func _create_slot(slot_title: String) -> PanelContainer:
	var slot := PanelContainer.new()
	slot.add_theme_stylebox_override("panel", _style(Color(0, 0, 0, 0), Color(0, 0, 0, 0), 0, 0))
	var box := Control.new()
	box.name = "SlotBox"
	box.set_anchors_preset(Control.PRESET_FULL_RECT)
	slot.add_child(box)

	var title := Label.new()
	title.name = "Title"
	title.text = ""
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 14)
	title.add_theme_color_override("font_color", Color("#d6c4a2"))
	box.add_child(title)

	var card := TextureRect.new()
	card.name = "Card"
	card.set_anchors_preset(Control.PRESET_FULL_RECT)
	card.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	card.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	card.visible = false
	box.add_child(card)
	return slot

func _create_xp_board() -> PanelContainer:
	var board := PanelContainer.new()
	board.add_theme_stylebox_override("panel", _style(Color("#6c3518"), Color("#2b170f"), 5, 18))
	var row := HBoxContainer.new()
	row.name = "XPRow"
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 8)
	row.set_anchors_preset(Control.PRESET_FULL_RECT)
	board.add_child(row)
	return board

func _create_big_status_label() -> Label:
	var label := Label.new()
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 72)
	label.add_theme_color_override("font_color", Color("#ffffff"))
	label.add_theme_color_override("font_shadow_color", Color("#000000"))
	label.add_theme_constant_override("shadow_offset_x", 5)
	label.add_theme_constant_override("shadow_offset_y", 5)
	return label

func start_new_match() -> void:
	turn_count = 1
	resolving = false
	action_buttons.visible = false
	_clear_play_slots()
	if log_label != null:
		log_label.clear()
	player_history.clear()
	player = _new_unit("VOCE")
	enemy = _new_unit("INIMIGO")
	_draw_cards(player, 6)
	_draw_cards(enemy, 6)
	_log("[center][color=#ffd76a]Nova batalha PvE iniciada.[/color][/center]")
	_update_ui()

func _new_unit(unit_name: String) -> Dictionary:
	return {
		"name": unit_name,
		"hp": 6,
		"max_hp": 6,
		"lvl": 1,
		"deck": _generate_deck(),
		"hand": [],
		"xp": [],
		"disabled": "",
		"bonus_atk": 0,
		"bonus_block": 0,
		"last_action": "",
	}

func _generate_deck() -> Array[String]:
	var deck: Array[String] = []
	for key in DECK_TEMPLATE.keys():
		for i in range(DECK_TEMPLATE[key]):
			deck.append(key)
	deck.shuffle()
	return deck

func _draw_cards(unit: Dictionary, amount: int) -> void:
	for i in range(amount):
		if unit.deck.is_empty():
			return
		unit.hand.append(unit.deck.pop_back())
	unit.hand.sort()

func _update_ui() -> void:
	_update_status_label(enemy_status_label, enemy)
	_update_status_label(player_status_label, player)
	_update_xp_board(enemy_xp_board, enemy)
	_update_xp_board(player_xp_board, player)
	_render_hand()
	center_label.text = ""

func _update_status_label(label: Label, unit: Dictionary) -> void:
	if label == null:
		return
	label.text = "%d/%d" % [unit.lvl, max(0, unit.hp)]

func _update_xp_board(board: PanelContainer, unit: Dictionary) -> void:
	if board == null:
		return
	var row: HBoxContainer = board.get_node("XPRow")
	for child in row.get_children():
		child.queue_free()
	for card_key in unit.xp:
		var mini := TextureRect.new()
		mini.custom_minimum_size = Vector2(88, 126)
		mini.texture = _card_texture(card_key)
		mini.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		mini.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		row.add_child(mini)

func _update_unit_panel(panel: PanelContainer, unit: Dictionary) -> void:
	var stats: Label = panel.get_node("UnitBox/Stats")
	var xp: Label = panel.get_node("UnitBox/XP")
	var mastery: Label = panel.get_node("UnitBox/Mastery")
	var blocked := "Nenhuma"
	if unit.disabled != "":
		blocked = unit.disabled
	stats.text = "HP %d/%d   NIVEL %d   BLOQUEADO: %s" % [
		max(0, unit.hp), unit.max_hp, unit.lvl, blocked
	]
	xp.text = "XP %d/5: %s" % [unit.xp.size(), _compact_cards(unit.xp)]
	mastery.text = "Maestrias: ATQ +%d   BLOQ +%d" % [unit.bonus_atk, unit.bonus_block]

func _clear_play_slots() -> void:
	if enemy_slot != null:
		_set_slot_card(enemy_slot, "", false)
	if player_slot != null:
		_set_slot_card(player_slot, "", true)

func _set_slot_card(slot: PanelContainer, card_key: String, is_player_card: bool) -> void:
	if slot == null:
		return
	var card: TextureRect = slot.get_node("SlotBox/Card")
	if card_key == "":
		card.texture = null
		card.visible = false
		return
	card.texture = _card_texture(card_key)
	card.visible = true
	slot.add_theme_stylebox_override("panel", _style(Color(0, 0, 0, 0), Color(0, 0, 0, 0), 0, 0))

func _create_card_face(card_key: String, size: Vector2, compact: bool = false) -> Button:
	var btn := Button.new()
	btn.custom_minimum_size = size
	btn.text = ""
	btn.add_theme_stylebox_override("normal", _style(Color(0, 0, 0, 0), Color(0, 0, 0, 0), 0, 0))
	btn.add_theme_stylebox_override("hover", _style(Color(1, 1, 1, 0.08), Color("#ffffff"), 2, 8))
	btn.add_theme_stylebox_override("pressed", _style(Color(0, 0, 0, 0.12), Color("#ffffff"), 2, 8))
	btn.add_theme_stylebox_override("disabled", _style(Color(0, 0, 0, 0), Color(0, 0, 0, 0), 0, 0))
	var art := TextureRect.new()
	art.name = "Art"
	art.texture = _card_texture(card_key)
	art.mouse_filter = Control.MOUSE_FILTER_IGNORE
	art.set_anchors_preset(Control.PRESET_FULL_RECT)
	art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	btn.add_child(art)
	return btn

func _create_card_back(size: Vector2) -> Button:
	var btn := Button.new()
	btn.custom_minimum_size = size
	btn.text = "BUPPO"
	btn.add_theme_font_size_override("font_size", 22)
	btn.add_theme_color_override("font_color", Color("#ffd76a"))
	btn.add_theme_stylebox_override("normal", _style(Color("#47301d"), Color("#ffd76a"), 4, 14))
	btn.disabled = true
	return btn

func _card_texture(card_key: String) -> Texture2D:
	return _image_texture(CARD_IMAGE_PATHS[card_key])

func _image_texture(path: String) -> Texture2D:
	var image := Image.new()
	var err := image.load(path)
	if err != OK:
		return null
	return ImageTexture.create_from_image(image)

func _render_hand() -> void:
	for child in hand_row.get_children():
		child.queue_free()
	var count: int = player.hand.size()
	var step: float = 162.0
	var total_width: float = CARD_SIZE.x + step * max(0, count - 1)
	var start_x: float = (1080.0 - total_width) * 0.5
	for i in range(player.hand.size()):
		var card_key: String = player.hand[i]
		var btn := _create_card_face(card_key, CARD_SIZE, true)
		btn.name = "HandCard%d" % i
		btn.position = Vector2(start_x + step * i, 0)
		btn.size = CARD_SIZE
		btn.disabled = resolving
		if player.disabled == card_key:
			btn.disabled = true
			btn.modulate = Color(0.45, 0.45, 0.45, 0.78)
		btn.pressed.connect(_on_card_pressed.bind(i))
		hand_row.add_child(btn)

func _short_card_text(card_key: String) -> String:
	if card_key == "ATAQUE":
		return "Dano = nivel"
	if card_key == "BLOQUEIO":
		return "Anula ataque"
	if card_key == "DESCANSAR":
		return "Cura 2 ou 3"
	if card_key == "TREINAR":
		return "+1 XP do deck"
	if card_key == "DESARMAR":
		return "Bloqueia acao"
	return ""

func _on_card_pressed(index: int) -> void:
	if resolving or index < 0 or index >= player.hand.size():
		return
	var card_key: String = player.hand[index]
	if card_key == "DESARMAR":
		_show_disarm_choices(index)
	else:
		_play_player_card(index, "")

func _show_disarm_choices(index: int) -> void:
	selected_disarm_card_index = index
	action_buttons.visible = true
	for child in action_buttons.get_children():
		child.queue_free()
	for action in ACTIONS:
		var btn := Button.new()
		btn.text = action
		btn.custom_minimum_size = Vector2(88, 48)
		btn.add_theme_font_size_override("font_size", 11)
		btn.pressed.connect(_on_disarm_choice.bind(action))
		action_buttons.add_child(btn)
	center_label.text = "Escolha a acao que o inimigo nao podera jogar"

func _on_disarm_choice(action: String) -> void:
	action_buttons.visible = false
	_play_player_card(selected_disarm_card_index, action)
	selected_disarm_card_index = -1

func _play_player_card(index: int, player_disarm_choice: String) -> void:
	if index < 0 or index >= player.hand.size():
		return
	resolving = true
	var player_action: String = player.hand[index]
	var hand_card := hand_row.get_node_or_null("HandCard%d" % index) as Control
	var player_start_rect := hand_card.get_global_rect() if hand_card != null else Rect2(Vector2(180, get_viewport_rect().size.y - 140), Vector2(126, 146))
	player.hand.remove_at(index)
	player_history.append(player_action)

	var enemy_move := _get_enemy_move()
	var enemy_action: String = enemy_move.card
	var enemy_disarm_target: String = enemy_move.disarm_target
	if enemy_move.index >= 0 and enemy_move.index < enemy.hand.size():
		enemy.hand.remove_at(enemy_move.index)

	_clear_play_slots()
	_update_ui()
	center_label.text = "Jogando cartas..."
	await _animate_card_to_slot(player_action, player_start_rect, player_slot, true, false)
	await _animate_card_to_slot(enemy_action, Rect2(Vector2(get_viewport_rect().size.x * 0.5 - 63, 84), Vector2(126, 146)), enemy_slot, false, true)
	center_label.text = "Cartas na mesa"
	_log("[color=#ffd76a]Turno %d[/color]: Voce jogou [b]%s[/b]. Inimigo jogou [b]%s[/b]." % [
		turn_count, player_action, enemy_action
	])

	await get_tree().create_timer(0.25).timeout
	await _resolve_turn(player_action, enemy_action, player_disarm_choice, enemy_disarm_target)

func _animate_card_to_slot(card_key: String, start_rect: Rect2, slot: PanelContainer, is_player_card: bool, start_face_down: bool) -> void:
	var ghost := _create_card_back(start_rect.size) if start_face_down else _create_card_face(card_key, start_rect.size, true)
	ghost.disabled = true
	ghost.position = start_rect.position
	ghost.size = start_rect.size
	add_child(ghost)
	ghost.z_index = 100

	var target_rect := slot.get_global_rect()
	var target_size := TABLE_CARD_SIZE
	var target_pos := target_rect.position + (target_rect.size - target_size) * 0.5

	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(ghost, "position", target_pos, 0.34).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tween.tween_property(ghost, "custom_minimum_size", target_size, 0.34).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tween.tween_property(ghost, "size", target_size, 0.34).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	await tween.finished

	if start_face_down:
		ghost.queue_free()
		ghost = _create_card_face(card_key, target_size, true)
		ghost.disabled = true
		ghost.position = target_pos
		ghost.size = target_size
		add_child(ghost)
		ghost.z_index = 100
		var flip_tween := create_tween()
		ghost.scale = Vector2(0.1, 1.0)
		flip_tween.tween_property(ghost, "scale", Vector2.ONE, 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		await flip_tween.finished

	_set_slot_card(slot, card_key, is_player_card)
	ghost.queue_free()

func _get_enemy_move() -> Dictionary:
	var moves: Array[Dictionary] = []
	for i in range(enemy.hand.size()):
		var card: String = enemy.hand[i]
		if card != enemy.disabled:
			moves.append({"card": card, "index": i, "score": 50.0})
	if moves.is_empty():
		return {"card": "ATAQUE", "index": -1, "disarm_target": "ATAQUE"}

	var recent := player_history.slice(max(0, player_history.size() - 5), player_history.size())
	var attack_count := 0
	for action in recent:
		if action == "ATAQUE":
			attack_count += 1
	var player_aggro := 0.5
	if recent.size() > 0:
		player_aggro = float(attack_count) / float(recent.size())
	var threat_lvl: int = player.lvl + player.bonus_atk
	var am_dying: bool = enemy.hp <= threat_lvl
	var my_dmg: int = enemy.lvl + enemy.bonus_atk
	var can_kill: bool = player.hp <= my_dmg

	for move in moves:
		var card: String = move.card
		var score := 50.0
		if card == "ATAQUE":
			if can_kill:
				score += 500.0
			if player_aggro < 0.4:
				score += 40.0
			if am_dying:
				score -= 30.0
		elif card == "BLOQUEIO":
			if am_dying:
				score += 100.0
			if player_aggro > 0.6:
				score += 60.0
			if threat_lvl >= 3:
				score += 40.0
		elif card == "DESCANSAR":
			if enemy.hp == enemy.max_hp:
				score -= 100.0
			elif enemy.hp <= 3:
				score += 50.0
			if player_aggro > 0.7:
				score -= 40.0
		elif card == "DESARMAR":
			if am_dying:
				score += 120.0
			if player_aggro > 0.8:
				score += 50.0
		elif card == "TREINAR":
			if turn_count < 5:
				score += 30.0
			if am_dying or enemy.hp <= 3:
				score -= 200.0
		move.score = score + rng.randf_range(0.0, 15.0)

	moves.sort_custom(func(a, b): return a.score > b.score)
	var best: Dictionary = moves[0]
	var target := ""
	if best.card == "DESARMAR":
		target = _choose_enemy_disarm_target()
	return {"card": best.card, "index": best.index, "disarm_target": target}

func _choose_enemy_disarm_target() -> String:
	if player.hp <= enemy.lvl + enemy.bonus_atk + 2:
		return "BLOQUEIO"
	var counts := {}
	for card in player.xp:
		counts[card] = counts.get(card, 0) + 1
	for key in counts.keys():
		if counts[key] >= 3:
			return key
	return "ATAQUE"

func _resolve_turn(player_action: String, enemy_action: String, player_disarm_choice: String, enemy_disarm_target: String) -> void:
	var player_damage := 0
	var enemy_damage := 0

	if enemy_action == "ATAQUE":
		player_damage += enemy.lvl
	if player_action == "ATAQUE":
		enemy_damage += player.lvl

	var player_blocks := player_action == "BLOQUEIO" and enemy_action == "ATAQUE"
	var enemy_blocks := enemy_action == "BLOQUEIO" and player_action == "ATAQUE"
	if player_action == "BLOQUEIO":
		player_damage = 0
		if enemy_action == "ATAQUE":
			enemy_damage += 1 + player.bonus_block
	if enemy_action == "BLOQUEIO":
		enemy_damage = 0
		if player_action == "ATAQUE":
			player_damage += 1 + enemy.bonus_block

	var next_player_disabled := ""
	var next_enemy_disabled := ""
	if enemy_action == "DESARMAR":
		next_player_disabled = enemy_disarm_target if enemy_disarm_target != "" else "ATAQUE"
	if player_action == "DESARMAR":
		next_enemy_disabled = player_disarm_choice
	if player_action == "DESARMAR" and enemy_action == "DESARMAR":
		next_player_disabled = ""
		next_enemy_disabled = ""
		_log("[color=#aaa]Os dois desarmes colidiram e foram anulados.[/color]")

	player.disabled = next_player_disabled
	enemy.disabled = next_enemy_disabled

	if player_blocks:
		_log("[color=#7fc8ff]Voce bloqueou o ataque e contra-atacou.[/color]")
	if enemy_blocks:
		_log("[color=#ffb36d]O inimigo bloqueou e contra-atacou.[/color]")

	if player_damage > 0:
		player.hp -= player_damage
		_log("[color=#ff7777]Voce recebeu %d de dano.[/color]" % player_damage)
	if enemy_damage > 0:
		enemy.hp -= enemy_damage
		_log("[color=#8ff0a4]Inimigo recebeu %d de dano.[/color]" % enemy_damage)

	var player_dead: bool = player.hp <= 0
	var enemy_dead: bool = enemy.hp <= 0

	if not player_dead and player_action == "DESCANSAR":
		var heal := 3 if player_damage == 0 else 2
		player.hp = min(player.max_hp, player.hp + heal)
		_log("[color=#7dffa3]Voce recuperou %d HP.[/color]" % heal)
	if not enemy_dead and enemy_action == "DESCANSAR":
		var heal_e := 3 if enemy_damage == 0 else 2
		enemy.hp = min(enemy.max_hp, enemy.hp + heal_e)
		_log("[color=#ffdf8a]Inimigo recuperou %d HP.[/color]" % heal_e)

	if not player_dead and player_action == "TREINAR":
		_add_top_deck_to_xp(player, "Voce treinou")
	if not enemy_dead and enemy_action == "TREINAR":
		_add_top_deck_to_xp(enemy, "Inimigo treinou")
	if not player_dead and player_action == "ATAQUE" and enemy_action == "DESCANSAR":
		_add_top_deck_to_xp(player, "Golpe surpresa")
	if not enemy_dead and enemy_action == "ATAQUE" and player_action == "DESCANSAR":
		_add_top_deck_to_xp(enemy, "Golpe surpresa inimigo")

	player.last_action = player_action
	enemy.last_action = enemy_action

	if not player_dead:
		await _animate_slot_to_xp(player_action, player_slot, player_xp_board)
		player.xp.append(player_action)
	if not enemy_dead:
		await _animate_slot_to_xp(enemy_action, enemy_slot, enemy_xp_board)
		enemy.xp.append(enemy_action)
	_clear_play_slots()

	_check_level_up(player, true)
	_check_level_up(enemy, false)

	_check_end_or_next_turn()

func _animate_slot_to_xp(card_key: String, slot: PanelContainer, board: PanelContainer) -> void:
	if slot == null or board == null:
		return
	var start_rect := slot.get_global_rect()
	var board_rect := board.get_global_rect()
	var ghost := _create_card_face(card_key, TABLE_CARD_SIZE, true)
	ghost.disabled = true
	ghost.position = start_rect.position
	ghost.size = TABLE_CARD_SIZE
	add_child(ghost)
	ghost.z_index = 101
	var target_size := Vector2(88, 126)
	var target_pos := board_rect.position + Vector2(24 + min(4, board.get_node("XPRow").get_child_count()) * 96, (board_rect.size.y - target_size.y) * 0.5)
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(ghost, "position", target_pos, 0.28).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(ghost, "size", target_size, 0.28).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(ghost, "custom_minimum_size", target_size, 0.28).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN_OUT)
	await tween.finished
	ghost.queue_free()

func _add_top_deck_to_xp(unit: Dictionary, source: String) -> void:
	if unit.deck.is_empty():
		return
	var card: String = unit.deck.pop_back()
	unit.xp.append(card)
	_log("%s: carta [b]%s[/b] foi para XP." % [source, card])

func _check_level_up(unit: Dictionary, is_player: bool) -> void:
	if unit.xp.size() < 5:
		return
	var counts := {}
	for card in unit.xp:
		counts[card] = counts.get(card, 0) + 1
	var triggers: Array[String] = []
	for key in counts.keys():
		if counts[key] >= 3:
			triggers.append(key)

	for trigger in triggers:
		_apply_mastery(unit, trigger, is_player)

	unit.lvl += 1
	for card in unit.xp:
		unit.deck.append(card)
	unit.xp.clear()
	unit.deck.shuffle()
	_log("[color=#ffd76a]%s subiu para o nivel %d.[/color]" % [unit.name, unit.lvl])

func _apply_mastery(unit: Dictionary, mastery: String, is_player: bool) -> void:
	var target := enemy if is_player else player
	_log("[color=#caa7ff]Maestria em %s ativada por %s.[/color]" % [mastery, unit.name])
	if mastery == "ATAQUE":
		unit.bonus_atk += 1
		target.hp -= unit.bonus_atk
		_log("%s causou %d de dano de maestria." % [unit.name, unit.bonus_atk])
	elif mastery == "BLOQUEIO":
		unit.bonus_block += 1
	elif mastery == "DESCANSAR":
		if unit.hp > 0:
			unit.hp = unit.max_hp
			_log("%s recuperou toda a vida." % unit.name)
	elif mastery == "DESARMAR":
		if is_player:
			enemy.disabled = _choose_player_mastery_disarm_target()
			_log("Maestria em Desarmar bloqueou %s do inimigo." % enemy.disabled)
		else:
			player.disabled = "BLOQUEIO" if player.hp <= 4 else "ATAQUE"
	elif mastery == "TREINAR":
		var options: Array[String] = []
		for card in unit.xp:
			if card != "TREINAR" and not options.has(card):
				options.append(card)
		if options.is_empty():
			return
		var copied: String = options[0]
		if not is_player:
			if unit.hp <= 4 and options.has("DESCANSAR"):
				copied = "DESCANSAR"
			elif options.has("ATAQUE"):
				copied = "ATAQUE"
			elif options.has("BLOQUEIO"):
				copied = "BLOQUEIO"
		_log("%s copiou Maestria em %s." % [unit.name, copied])
		_apply_mastery(unit, copied, is_player)

func _choose_player_mastery_disarm_target() -> String:
	if enemy.hp <= player.lvl + player.bonus_atk + 2:
		return "BLOQUEIO"
	var counts := {}
	for card in enemy.xp:
		counts[card] = counts.get(card, 0) + 1
	for key in counts.keys():
		if counts[key] >= 3:
			return key
	return "ATAQUE"

func _check_end_or_next_turn() -> void:
	_update_ui()
	if player.hp <= 0 or enemy.hp <= 0:
		var result := ""
		if player.hp <= 0 and enemy.hp <= 0:
			result = "EMPATE"
		elif enemy.hp <= 0:
			result = "VITORIA"
		else:
			result = "DERROTA"
		_show_end_screen(result)
		return

	var player_hand_before: int = player.hand.size()
	var enemy_hand_before: int = enemy.hand.size()
	_draw_cards(player, 1)
	_draw_cards(enemy, 1)
	if player.hand.size() > player_hand_before:
		_log("[color=#ffd76a]Voce comprou 1 carta do seu deck.[/color]")
	if enemy.hand.size() > enemy_hand_before:
		_log("[color=#d6c4a2]Inimigo comprou 1 carta do deck.[/color]")
	turn_count += 1
	resolving = false
	_update_ui()

func _show_end_screen(result: String) -> void:
	resolving = true
	overlay_panel.visible = true
	for child in overlay_panel.get_children():
		child.queue_free()
	var box := VBoxContainer.new()
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.set_anchors_preset(Control.PRESET_FULL_RECT)
	box.add_theme_constant_override("separation", 28)
	overlay_panel.add_child(box)

	var title := Label.new()
	title.text = result
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 82)
	title.add_theme_color_override("font_color", Color("#ffd76a"))
	box.add_child(title)

	var turns := Label.new()
	turns.text = "Partida encerrada no turno %d" % turn_count
	turns.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	turns.add_theme_font_size_override("font_size", 34)
	turns.add_theme_color_override("font_color", Color("#ffffff"))
	box.add_child(turns)

	var restart := Button.new()
	restart.text = "JOGAR NOVAMENTE"
	restart.custom_minimum_size = Vector2(520, 96)
	restart.add_theme_font_size_override("font_size", 32)
	restart.pressed.connect(func():
		overlay_panel.visible = false
		start_new_match()
	)
	box.add_child(restart)

func _compact_cards(cards: Array) -> String:
	if cards.is_empty():
		return "-"
	var counts := {}
	for card in cards:
		counts[card] = counts.get(card, 0) + 1
	var chunks: Array[String] = []
	for key in ACTIONS:
		if counts.has(key):
			chunks.append("%s x%d" % [key.substr(0, 3), counts[key]])
	return ", ".join(chunks)

func _log(text: String) -> void:
	if log_label == null:
		return
	log_label.append_text(text + "\n")
	log_label.scroll_to_line(log_label.get_line_count())

func _style(fill: Color, border: Color, border_width: int, radius: int) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = fill
	style.border_color = border
	style.set_border_width_all(border_width)
	style.set_corner_radius_all(radius)
	style.content_margin_left = 14
	style.content_margin_right = 14
	style.content_margin_top = 12
	style.content_margin_bottom = 12
	return style
