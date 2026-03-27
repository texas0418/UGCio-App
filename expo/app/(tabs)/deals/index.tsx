import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Plus,
  X,
  ChevronRight,
  CircleDot,
  MessageSquare,
  FileText,
  PackageCheck,
  DollarSign,
  Trash2,
  Receipt,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useCreator } from "@/contexts/CreatorContext";
import { BrandDeal, DealStatus } from "@/types";

const DEAL_STATUSES: { value: DealStatus; label: string; color: string; bg: string; icon: React.ComponentType<{ size: number; color: string }> }[] = [
  { value: "new", label: "New", color: "#60A5FA", bg: "rgba(96, 165, 250, 0.12)", icon: CircleDot },
  { value: "in_talks", label: "In Talks", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)", icon: MessageSquare },
  { value: "contracted", label: "Contracted", color: Colors.accent, bg: Colors.accentLight, icon: FileText },
  { value: "delivered", label: "Delivered", color: Colors.primary, bg: Colors.primaryLight, icon: PackageCheck },
  { value: "paid", label: "Paid", color: Colors.success, bg: Colors.successLight, icon: DollarSign },
];

export default function DealsScreen() {
  const router = useRouter();
  const { deals, addDeal, updateDeal, removeDeal } = useCreator();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<DealStatus | "all">("all");
  const [formData, setFormData] = useState({
    brandName: "",
    contactEmail: "",
    description: "",
    budget: "",
  });

  const filteredDeals = useMemo(() => {
    if (selectedStatus === "all") return deals;
    return deals.filter((d) => d.status === selectedStatus);
  }, [deals, selectedStatus]);

  const dealsByStatus = useMemo(() => {
    const counts: Record<string, number> = { all: deals.length };
    DEAL_STATUSES.forEach((s) => {
      counts[s.value] = deals.filter((d) => d.status === s.value).length;
    });
    return counts;
  }, [deals]);

  const totalPipeline = useMemo(() => {
    return deals
      .filter((d) => d.status !== "paid")
      .reduce((sum, d) => sum + (d.budget ?? 0), 0);
  }, [deals]);

  const totalEarned = useMemo(() => {
    return deals
      .filter((d) => d.status === "paid")
      .reduce((sum, d) => sum + (d.budget ?? 0), 0);
  }, [deals]);

  const handleAdd = useCallback(() => {
    if (!formData.brandName) {
      Alert.alert("Missing Info", "Please enter the brand name.");
      return;
    }
    const deal: BrandDeal = {
      id: Date.now().toString(),
      brandName: formData.brandName,
      contactEmail: formData.contactEmail,
      description: formData.description,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      status: "new",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addDeal(deal);
    setFormData({ brandName: "", contactEmail: "", description: "", budget: "" });
    setShowAddForm(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [formData, addDeal]);

  const moveToNext = useCallback(
    (deal: BrandDeal) => {
      const order: DealStatus[] = ["new", "in_talks", "contracted", "delivered", "paid"];
      const currentIndex = order.indexOf(deal.status);
      if (currentIndex < order.length - 1) {
        const nextStatus = order[currentIndex + 1];
        updateDeal(deal.id, { status: nextStatus });
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    },
    [updateDeal]
  );

  const confirmRemove = useCallback(
    (id: string) => {
      Alert.alert("Remove Deal", "Remove this deal from your tracker?", [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => removeDeal(id) },
      ]);
    },
    [removeDeal]
  );

  const getStatusConfig = (status: DealStatus) => {
    return DEAL_STATUSES.find((s) => s.value === status) ?? DEAL_STATUSES[0];
  };

  const getNextStatusLabel = (status: DealStatus): string | null => {
    const order: DealStatus[] = ["new", "in_talks", "contracted", "delivered", "paid"];
    const idx = order.indexOf(status);
    if (idx < order.length - 1) {
      return DEAL_STATUSES.find((s) => s.value === order[idx + 1])?.label ?? null;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pipeline</Text>
            <Text style={styles.summaryValue}>${totalPipeline.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardEarned]}>
            <Text style={styles.summaryLabel}>Earned</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              ${totalEarned.toLocaleString()}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedStatus === "all" && styles.filterChipActive]}
            onPress={() => setSelectedStatus("all")}
          >
            <Text style={[styles.filterChipText, selectedStatus === "all" && styles.filterChipTextActive]}>
              All ({dealsByStatus.all})
            </Text>
          </TouchableOpacity>
          {DEAL_STATUSES.map((s) => {
            const isActive = selectedStatus === s.value;
            return (
              <TouchableOpacity
                key={s.value}
                style={[
                  styles.filterChip,
                  isActive && { backgroundColor: s.bg, borderColor: s.color },
                ]}
                onPress={() => setSelectedStatus(s.value)}
              >
                <Text style={[styles.filterChipText, isActive && { color: s.color }]}>
                  {s.label} ({dealsByStatus[s.value] ?? 0})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {showAddForm && (
          <View style={styles.addForm}>
            <View style={styles.addFormHeader}>
              <Text style={styles.addFormTitle}>New Deal</Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)} style={styles.closeBtn}>
                <X size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={formData.brandName}
              onChangeText={(t) => setFormData((p) => ({ ...p, brandName: t }))}
              placeholder="Brand name"
              placeholderTextColor={Colors.textTertiary}
            />
            <TextInput
              style={styles.input}
              value={formData.contactEmail}
              onChangeText={(t) => setFormData((p) => ({ ...p, contactEmail: t }))}
              placeholder="Contact email"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, styles.descInput]}
              value={formData.description}
              onChangeText={(t) => setFormData((p) => ({ ...p, description: t }))}
              placeholder="Deal description / deliverables..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              textAlignVertical="top"
            />
            <TextInput
              style={styles.input}
              value={formData.budget}
              onChangeText={(t) => setFormData((p) => ({ ...p, budget: t }))}
              placeholder="Budget ($)"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Add Deal</Text>
            </TouchableOpacity>
          </View>
        )}

        {filteredDeals.length > 0 ? (
          <View style={styles.dealsList}>
            {filteredDeals.map((deal) => {
              const config = getStatusConfig(deal.status);
              const nextLabel = getNextStatusLabel(deal.status);
              const StatusIcon = config.icon;
              return (
                <View key={deal.id} style={styles.dealCard}>
                  <View style={styles.dealHeader}>
                    <View style={styles.dealBrandRow}>
                      <View style={[styles.dealInitial, { backgroundColor: config.bg }]}>
                        <Text style={[styles.dealInitialText, { color: config.color }]}>
                          {deal.brandName[0]?.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.dealBrandInfo}>
                        <Text style={styles.dealBrandName}>{deal.brandName}</Text>
                        {deal.contactEmail ? (
                          <Text style={styles.dealEmail} numberOfLines={1}>
                            {deal.contactEmail}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                      <StatusIcon size={12} color={config.color} />
                      <Text style={[styles.statusText, { color: config.color }]}>
                        {config.label}
                      </Text>
                    </View>
                  </View>

                  {deal.description ? (
                    <Text style={styles.dealDesc} numberOfLines={2}>
                      {deal.description}
                    </Text>
                  ) : null}

                  {deal.budget ? (
                    <View style={styles.dealBudgetRow}>
                      <DollarSign size={14} color={Colors.primary} />
                      <Text style={styles.dealBudget}>${deal.budget.toLocaleString()}</Text>
                    </View>
                  ) : null}

                  <View style={styles.dealActions}>
                    <View style={styles.dealActionsLeft}>
                      <TouchableOpacity
                        onPress={() => confirmRemove(deal.id)}
                        style={styles.dealActionBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={14} color={Colors.danger} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          router.push({
                            pathname: "/invoice" as never,
                            params: {
                              dealId: deal.id,
                              brandName: deal.brandName,
                              brandEmail: deal.contactEmail,
                              budget: deal.budget?.toString() ?? "",
                            },
                          })
                        }
                        style={styles.dealActionBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Receipt size={14} color={Colors.accent} />
                      </TouchableOpacity>
                    </View>
                    {nextLabel && (
                      <TouchableOpacity
                        style={[styles.moveBtn, { backgroundColor: config.bg }]}
                        onPress={() => moveToNext(deal)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.moveBtnText, { color: config.color }]}>
                          Move to {nextLabel}
                        </Text>
                        <ChevronRight size={14} color={config.color} />
                      </TouchableOpacity>
                    )}
                    {deal.status === "paid" && (
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidBadgeText}>Completed</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <FileText size={36} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No deals yet</Text>
            <Text style={styles.emptySubtitle}>
              Track your brand partnerships from first contact to payment
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {!showAddForm && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddForm(true)}
          activeOpacity={0.85}
          testID="add-deal-btn"
        >
          <Plus size={22} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
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
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryCardEarned: {
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  addForm: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
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
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  descInput: {
    minHeight: 80,
    paddingTop: 14,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  dealsList: {
    gap: 10,
  },
  dealCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  dealBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  dealInitial: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dealInitialText: {
    fontSize: 18,
    fontWeight: "800" as const,
  },
  dealBrandInfo: {
    flex: 1,
  },
  dealBrandName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  dealEmail: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  dealDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  dealBudgetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  dealBudget: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  dealActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  dealActionsLeft: {
    flexDirection: "row",
    gap: 8,
  },
  dealActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  moveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  moveBtnText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  paidBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  paidBadgeText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.success,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
