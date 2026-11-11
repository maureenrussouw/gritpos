import { useState } from "react";
import { View, Text, TextInput, ScrollView, FlatList, Pressable, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "@/components/ui/screen-header";
import { FormSheet } from "@/components/ui/form-sheet";
import { useTheme } from "@/lib/theme";
import { useClients, useCreateClient, type Client } from "@/hooks/use-clients";
import { ClientForm } from "@/components/resource-forms/clients-form";
import { exportResourceCsv } from "@/lib/export";
import { ImportSheet } from "@/components/ui/import-sheet";

const TABLE_WIDTH = 480;

export default function ClientsScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const create = useCreateClient();
  const query = useClients(search, {}, sortBy, sortOrder);
  const items = query.data?.pages.flatMap((p) => p.data) ?? [];

  const onSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const onExport = async () => {
    try {
      await exportResourceCsv("clients", search ? "search=" + encodeURIComponent(search) : "");
    } catch (e: any) {
      Alert.alert("Export failed", e.message || "Please try again");
    }
  };

  const renderItem = ({ item }: { item: Client }) => (
    <Pressable
      onPress={() => router.push(`/clients/${item.id}`)}
      className="flex-row items-center border-b border-[#E5E7EB] dark:border-[#1f1f2b] bg-white dark:bg-[#111118]"
      style={{ width: TABLE_WIDTH }}
    >
      <View style={{ width: 180 }} className="px-3 py-3">
        <Text numberOfLines={1} className="text-[14px] font-semibold text-[#0F1018] dark:text-white">{String(item.name ?? "")}</Text>
      </View>
      <View style={{ width: 150 }} className="px-3 py-3">
        <Text numberOfLines={1} className="text-[14px] text-[#0F1018] dark:text-white">{String(item.phone ?? "")}</Text>
      </View>
      <View style={{ width: 150 }} className="px-3 py-3">
        <Text numberOfLines={1} className="text-[14px] text-[#0F1018] dark:text-white">{String(item.email ?? "")}</Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0a0a0f]">
      <ScreenHeader
        title="Clients"
        subtitle="Browse all clients"
        showBack
        right={
          <View className="flex-row items-center">
            <Pressable onPress={onExport} hitSlop={8} className="mr-4">
              <Ionicons name="download-outline" size={23} color="#6c5ce7" />
            </Pressable>
            <Pressable onPress={() => setImportOpen(true)} hitSlop={8} className="mr-4">
              <Ionicons name="cloud-upload-outline" size={23} color="#6c5ce7" />
            </Pressable>
            <Pressable onPress={() => setSheetOpen(true)} hitSlop={8}>
              <Ionicons name="add-circle" size={28} color="#6c5ce7" />
            </Pressable>
          </View>
        }
      />
      <View className="px-6 pb-3">
        <View
          className="bg-white dark:bg-[#111118] border border-[#E5E7EB] dark:border-[#2a2a3a] rounded-2xl flex-row items-center px-4"
          style={{ height: 48 }}
        >
          <Ionicons name="search-outline" size={18} color={palette.inputIcon} />
          <TextInput
            className="flex-1 ml-2.5 text-[#0F1018] dark:text-white text-[15px]"
            placeholder="Search clients..."
            placeholderTextColor={palette.placeholder}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ width: TABLE_WIDTH }}>
          <View className="flex-row border-b-2 border-[#E5E7EB] dark:border-[#2a2a3a]" style={{ width: TABLE_WIDTH }}>
            <Pressable onPress={() => onSort("name")} style={{ width: 180 }} className="px-3 py-3 flex-row items-center">
              <Text className="text-[12px] font-semibold text-[#6B7280] dark:text-[#9090a8]" numberOfLines={1}>Name</Text>
              {sortBy === "name" ? <Ionicons name={sortOrder === "asc" ? "arrow-up" : "arrow-down"} size={12} color="#6c5ce7" style={{ marginLeft: 4 }} /> : null}
            </Pressable>
            <Pressable onPress={() => onSort("phone")} style={{ width: 150 }} className="px-3 py-3 flex-row items-center">
              <Text className="text-[12px] font-semibold text-[#6B7280] dark:text-[#9090a8]" numberOfLines={1}>Phone</Text>
              {sortBy === "phone" ? <Ionicons name={sortOrder === "asc" ? "arrow-up" : "arrow-down"} size={12} color="#6c5ce7" style={{ marginLeft: 4 }} /> : null}
            </Pressable>
            <Pressable onPress={() => onSort("email")} style={{ width: 150 }} className="px-3 py-3 flex-row items-center">
              <Text className="text-[12px] font-semibold text-[#6B7280] dark:text-[#9090a8]" numberOfLines={1}>Email</Text>
              {sortBy === "email" ? <Ionicons name={sortOrder === "asc" ? "arrow-up" : "arrow-down"} size={12} color="#6c5ce7" style={{ marginLeft: 4 }} /> : null}
            </Pressable>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={{ flex: 1 }}
            onEndReached={() => {
              if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
            }}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} tintColor={palette.refresh} />
            }
            ListEmptyComponent={
              query.isLoading ? (
                <ActivityIndicator color={palette.refresh} style={{ marginTop: 40 }} />
              ) : (
                <Text className="text-[#6B7280] dark:text-[#9090a8] p-6">No clients yet</Text>
              )
            }
            ListFooterComponent={
              query.isFetchingNextPage ? (
                <ActivityIndicator color={palette.refresh} style={{ marginVertical: 16 }} />
              ) : null
            }
          />
        </View>
      </ScrollView>

      <FormSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="New Client">
        <ClientForm
          submitting={create.isPending}
          submitLabel="Create Client"
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            setSheetOpen(false);
          }}
        />
      </FormSheet>

      <ImportSheet plural="clients" visible={importOpen} onClose={() => setImportOpen(false)} onImported={() => query.refetch()} />
    </View>
  );
}
