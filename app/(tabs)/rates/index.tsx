import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import {
  Plus,
  X,
  Trash2,
  Edit3,
  Zap,
  TrendingUp,
  Hash,
  LayoutTemplate,
  ChevronRight,
  Copy,
  Share2,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useCreator } from "@/contexts/CreatorContext";
import { Deliverable } from "@/types";
import { RATE_TEMPLATES } from "@/mocks/templates";
import * as Linking from "expo-linking";

export default function RatesScreen() {
  const { deliverables, updateDeliverable, addDeliverable, removeDeliverable, setDeliverables, profile } =
    useCreator();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
  });

  const handleToggle = useCallback(
    (id: string, isActive: boolean) => {
      updateDeliverable(id, { isActive });
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [updateDeliverable]
  );

  const startEdit = useCallback((item: Deliverable) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description,
      price: item.price.toString(),
    });
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingId) return;
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price.");
      return;
    }
    updateDeliverable(editingId, {
      title: formData.title,
      description: formData.description,
      price,
    });
    setEditingId(null);
    setFormData({ title: "", description: "", price: "" });
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [editingId, formData, updateDeliverable]);

  const handleAdd = useCallback(() => {
    if (!formData.title) {
      Alert.alert("Missing Title", "Please enter a deliverable title.");
      return;
    }
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price.");
      return;
    }
    const item: Deliverable = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      price,
      currency: "USD",
      isActive: true,
    };
    addDeliverable(item);
    setFormData({ title: "", description: "", price: "" });
    setShowAddForm(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [formData, addDeliverable]);

  const confirmRemove = useCallback(
    (id: string) => {
      Alert.alert("Remove Deliverable", "Remove this from your rate card?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeDeliverable(id),
        },
      ]);
    },
    [removeDeliverable]
  );

  const applyTemplate = useCallback(
    (templateId: string) => {
      const template = RATE_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;

      Alert.alert(
        `Apply "${template.name}"?`,
        "This will replace your current rate card with this template's deliverables.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Apply",
            onPress: () => {
              const newDeliverables: Deliverable[] = template.deliverables.map((d, i) => ({
                ...d,
                id: `tpl_${Date.now()}_${i}`,
              }));
              setDeliverables(newDeliverables);
              setShowTemplates(false);
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            },
          },
        ]
      );
    },
    [setDeliverables]
  );

  const activeCount = deliverables.filter((d) => d.isActive).length;
  const totalValue = deliverables
    .filter((d) => d.isActive)
    .reduce((sum, d) => sum + d.price, 0);

  const handleExportRateCard = useCallback(async () => {
    const active = deliverables.filter((d) => d.isActive);
    if (active.length === 0) {
      Alert.alert("No Active Rates", "Enable at least one deliverable to export.");
      return;
    }
    const lines: string[] = [];
    lines.push("═══════════════════════════════");
    lines.push(`${profile.name || "Creator"} — Rate Card`);
    lines.push("═══════════════════════════════");
    lines.push("");
    active.forEach((d) => {
      lines.push(`▸ ${d.title}  —  ${d.price}`);
      if (d.description) lines.push(`  ${d.description}`);
      lines.push("");
    });
    lines.push("───────────────────────────────");
    lines.push(`Total Rate Card Value: ${totalValue}`);
    lines.push(`Active Services: ${activeCount}`);
    lines.push("");
    if (profile.username) {
      lines.push(`Book me: ugcio.app/${profile.username}`);
    }
    const text = lines.join("\n");
    await Clipboard.setStringAsync(text);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert("Rate Card Copied!", "Your rate card has been copied to clipboard. Paste it in emails, DMs, or pitch decks.");
  }, [deliverables, profile, totalValue, activeCount]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.accentLight }]}>
            <Hash size={16} color={Colors.accent} />
          </View>
          <Text style={styles.statValue}>{deliverables.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.successLight }]}>
            <Zap size={16} color={Colors.success} />
          </View>
          <Text style={[styles.statValue, { color: Colors.success }]}>
            {activeCount}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.primaryLight }]}>
            <TrendingUp size={16} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>${totalValue}</Text>
          <Text style={styles.statLabel}>Value</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.templateBanner}
        onPress={() => setShowTemplates(!showTemplates)}
        activeOpacity={0.7}
      >
        <View style={styles.templateBannerLeft}>
          <View style={styles.templateIconWrap}>
            <LayoutTemplate size={18} color={Colors.accent} />
          </View>
          <View>
            <Text style={styles.templateBannerTitle}>Rate Card Templates</Text>
            <Text style={styles.templateBannerSub}>Pre-built pricing by niche</Text>
          </View>
        </View>
        <ChevronRight
          size={18}
          color={Colors.textTertiary}
          style={showTemplates ? { transform: [{ rotate: "90deg" }] } : undefined}
        />
      </TouchableOpacity>

      {showTemplates && (
        <View style={styles.templatesSection}>
          {RATE_TEMPLATES.map((template) => {
            const totalPrice = template.deliverables
              .filter((d) => d.isActive)
              .reduce((sum, d) => sum + d.price, 0);
            return (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => applyTemplate(template.id)}
                activeOpacity={0.7}
              >
                <View style={styles.templateCardHeader}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <View style={styles.templateNicheBadge}>
                    <Text style={styles.templateNicheText}>{template.niche}</Text>
                  </View>
                </View>
                <View style={styles.templateMeta}>
                  <Text style={styles.templateCount}>
                    {template.deliverables.length} deliverables
                  </Text>
                  <Text style={styles.templateTotal}>from ${Math.min(...template.deliverables.map((d) => d.price))}</Text>
                </View>
                <View style={styles.templateItems}>
                  {template.deliverables.slice(0, 3).map((d, i) => (
                    <Text key={i} style={styles.templateItemText} numberOfLines={1}>
                      • {d.title} — ${d.price}
                    </Text>
                  ))}
                  {template.deliverables.length > 3 && (
                    <Text style={styles.templateMore}>
                      +{template.deliverables.length - 3} more
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {deliverables.length === 0 && !showAddForm && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <DollarSign size={36} color={Colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No rates yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your deliverables and pricing, or start with a template above
          </Text>
        </View>
      )}

      {deliverables.map((item) => {
        const isEditing = editingId === item.id;
        return (
          <View
            key={item.id}
            style={[styles.rateCard, !item.isActive && styles.rateCardInactive]}
          >
            {isEditing ? (
              <View style={styles.editForm}>
                <TextInput
                  style={styles.editInput}
                  value={formData.title}
                  onChangeText={(t) =>
                    setFormData((prev) => ({ ...prev, title: t }))
                  }
                  placeholder="Title"
                  placeholderTextColor={Colors.textTertiary}
                />
                <TextInput
                  style={[styles.editInput, styles.editDesc]}
                  value={formData.description}
                  onChangeText={(t) =>
                    setFormData((prev) => ({ ...prev, description: t }))
                  }
                  placeholder="Description"
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                />
                <View style={styles.priceEditRow}>
                  <Text style={styles.dollarPrefix}>$</Text>
                  <TextInput
                    style={[styles.editInput, styles.priceEditInput]}
                    value={formData.price}
                    onChangeText={(t) =>
                      setFormData((prev) => ({ ...prev, price: t }))
                    }
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setEditingId(null);
                      setFormData({ title: "", description: "", price: "" });
                    }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.rateHeader}>
                  <View style={styles.rateInfo}>
                    <Text style={styles.rateTitle}>{item.title}</Text>
                    <Text style={styles.rateDesc}>{item.description}</Text>
                  </View>
                  <View style={styles.priceTag}>
                    <Text style={styles.priceText}>${item.price}</Text>
                  </View>
                </View>
                <View style={styles.rateFooter}>
                  <View style={styles.rateActions}>
                    <TouchableOpacity
                      onPress={() => startEdit(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.actionBtn}
                    >
                      <Edit3 size={14} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmRemove(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.actionBtn}
                    >
                      <Trash2 size={14} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                  <Switch
                    value={item.isActive}
                    onValueChange={(v) => handleToggle(item.id, v)}
                    trackColor={{
                      false: Colors.border,
                      true: Colors.primaryLight,
                    }}
                    thumbColor={item.isActive ? Colors.primary : Colors.textTertiary}
                  />
                </View>
              </>
            )}
          </View>
        );
      })}

      {showAddForm && (
        <View style={styles.addForm}>
          <View style={styles.addFormHeader}>
            <Text style={styles.addFormTitle}>New Deliverable</Text>
            <TouchableOpacity
              onPress={() => setShowAddForm(false)}
              style={styles.closeBtn}
            >
              <X size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.editInput}
            value={formData.title}
            onChangeText={(t) =>
              setFormData((prev) => ({ ...prev, title: t }))
            }
            placeholder="e.g. Single UGC Video"
            placeholderTextColor={Colors.textTertiary}
          />
          <TextInput
            style={[styles.editInput, styles.editDesc]}
            value={formData.description}
            onChangeText={(t) =>
              setFormData((prev) => ({ ...prev, description: t }))
            }
            placeholder="Describe what's included..."
            placeholderTextColor={Colors.textTertiary}
            multiline
          />
          <View style={styles.priceEditRow}>
            <Text style={styles.dollarPrefix}>$</Text>
            <TextInput
              style={[styles.editInput, styles.priceEditInput]}
              value={formData.price}
              onChangeText={(t) =>
                setFormData((prev) => ({ ...prev, price: t }))
              }
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleAdd}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Add Deliverable</Text>
          </TouchableOpacity>
        </View>
      )}

      {!showAddForm && (
        <TouchableOpacity
          style={styles.addRow}
          onPress={() => {
            setFormData({ title: "", description: "", price: "" });
            setShowAddForm(true);
          }}
          activeOpacity={0.7}
          testID="add-deliverable-btn"
        >
          <Plus size={18} color={Colors.primary} />
          <Text style={styles.addRowText}>Add Deliverable</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.exportRow}
        onPress={handleExportRateCard}
        activeOpacity={0.7}
      >
        <View style={styles.exportIconWrap}>
          <Copy size={16} color={Colors.accent} />
        </View>
        <View style={styles.exportInfo}>
          <Text style={styles.exportTitle}>Export Rate Card</Text>
          <Text style={styles.exportSub}>Copy as shareable text for brands</Text>
        </View>
        <Share2 size={16} color={Colors.textTertiary} />
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  templateBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  templateBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  templateIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  templateBannerTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  templateBannerSub: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  templatesSection: {
    gap: 10,
    marginBottom: 20,
  },
  templateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  templateCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  templateName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    flex: 1,
  },
  templateNicheBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  templateNicheText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  templateMeta: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  templateCount: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  templateTotal: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: "600" as const,
  },
  templateItems: {
    gap: 4,
  },
  templateItemText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  templateMore: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontStyle: "italic" as const,
    marginTop: 2,
  },
  rateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rateCardInactive: {
    opacity: 0.45,
  },
  rateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  rateInfo: {
    flex: 1,
  },
  rateTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  rateDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  priceTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  rateFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  rateActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  editForm: {
    gap: 12,
  },
  editInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editDesc: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  priceEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dollarPrefix: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
  },
  priceEditInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700" as const,
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  addForm: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  addFormHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addFormTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
    backgroundColor: Colors.surface,
  },
  addRowText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  exportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exportIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  exportInfo: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  exportSub: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 260,
  },
});
