import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { tenderService, Tender, WorkOrder } from '../services/tenderService';
import { workOrderService } from '../services/workOrderService';
import { apiClient } from '../services/apiClient';
import { projectAssetService, DropdownItem } from '../services/projectAssetService';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Modal, TextInput, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const InfoItem = ({ label, value, icon }: any) => (
    <View style={styles.infoItem}>
        <View style={styles.infoIconWrapper}>
            {typeof icon === 'string' ? <Text style={styles.hashIcon}>{icon}</Text> : icon}
        </View>
        <View>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || '-'}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#eef1f5' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backLink: { marginTop: 7 },
    scrollContent: { padding: isMobile ? 8 : 16, paddingBottom: 28 },
    headerGradient: {
        paddingBottom: 16,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginHorizontal: -16,
        marginTop: -16,
        marginBottom: 11,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingTop: isMobile ? 12 : 20,
    },
    backButton: {
        width: 37,
        height: 37,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 11,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    headerBadgeText: {
        fontSize: 10,
        color: '#fff',
        marginLeft: 4,
        fontWeight: '500',
    },
    headerActionsContainer: {
        paddingHorizontal: 11,
        marginBottom: 11,
    },
    headerActions: { flexDirection: 'row', gap: 5, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end', marginTop: isMobile ? 8 : 0 },
    btnOutlineOrange: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#f97316', backgroundColor: '#fff7ed', flex: isMobile ? 1 : 0, alignItems: 'center' },
    btnOutlineTextOrange: { color: '#f97316', fontSize: 10, fontWeight: 'bold' },
    btnSolidRed: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20, backgroundColor: '#dc2626', flex: isMobile ? 1 : 0, alignItems: 'center' },
    btnSolidText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    statsContainer: { marginBottom: 11, gap: 8 },
    statsRowWrapper: { flexDirection: 'row', gap: 8 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 7, elevation: 2 },
    statIconBoxRed: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },
    statIconBoxOrange: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#ffedd5', justifyContent: 'center', alignItems: 'center' },
    statIconBoxGreen: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
    statIconBoxBlue: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
    statLabel: { fontSize: 10, fontWeight: 'bold', color: '#374151' },
    statSubLabel: { fontSize: 10, color: '#9ca3af' },
    statValue: { fontSize: 16, fontWeight: 'bold', color: '#b91c1c', marginLeft: 'auto' },
    statUnit: { fontSize: 10, color: '#9ca3af' },
    contentGrid: { flexDirection: isMobile ? 'column' : 'row', gap: 11 },
    mainColumn: { flex: 2, gap: 11 },
    sidebarColumn: { flex: 1, gap: 11 },
    sectionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 11, elevation: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 11 },
    sectionIconBoxRed: { width: 23, height: 23, borderRadius: 6, backgroundColor: '#dc2626', justifyContent: 'center', alignItems: 'center', marginRight: 7 },
    sectionIconBoxOrange: { width: 23, height: 23, borderRadius: 6, backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center', marginRight: 7 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#111827' },
    sectionSubtitle: { fontSize: 10, color: '#6b7280', marginTop: 1 },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
    infoItem: { width: isMobile ? '100%' : '50%', paddingHorizontal: 5, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 11 },
    infoIconWrapper: { width: 22, height: 22, backgroundColor: '#f3f4f6', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 7, marginTop: 2 },
    hashIcon: { fontSize: 11, fontWeight: 'bold', color: '#6b7280' },
    infoLabel: { fontSize: 10, color: '#6b7280', marginBottom: 1 },
    infoValue: { fontSize: 10, color: '#111827', fontWeight: '500' },
    documentItem: { flexDirection: 'row', alignItems: 'center', padding: 7, borderWidth: 1, borderColor: '#fee2e2', borderRadius: 10, marginBottom: 5, backgroundColor: '#fffcfc' },
    docIconBox: { width: 27, height: 27, borderRadius: 8, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginRight: 7 },
    docName: { flex: 1, fontSize: 11, fontWeight: '500', color: '#1f2937' },
    docActions: { flexDirection: 'row', gap: 5 },
    docActionBtn: { flexDirection: 'row', alignItems: 'center', padding: 2 },
    docDownloadBtn: { flexDirection: 'row', alignItems: 'center', padding: 4, borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 6, backgroundColor: '#f0fdf4' },
    docActionText: { fontSize: 10, fontWeight: '600' },
    emptyPlaceholderCard: { flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', padding: 8, borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, backgroundColor: '#fef2f2', gap: 7 },
    emptyPlaceholderIconBox: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#fecaca' },
    placeholderTitle: { fontSize: 11, fontWeight: 'bold', color: '#374151' },
    placeholderSubtitle: { fontSize: 10, color: '#9ca3af' },
    btnSolidRedSm: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 20, backgroundColor: '#dc2626', alignSelf: isMobile ? 'flex-end' : 'auto' },
    btnSolidTextSm: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    vendorItem: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
    vendorAvatar: { width: 23, height: 23, borderRadius: 14, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },
    vendorName: { fontSize: 10, fontWeight: 'bold', color: '#374151' },
    vendorEmail: { fontSize: 10, color: '#6b7280' },
    assetItem: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
    assetIconBox: { width: 23, height: 23, borderRadius: 6, backgroundColor: '#ffedd5', justifyContent: 'center', alignItems: 'center' },
    assetName: { fontSize: 10, color: '#374151', fontWeight: '500' },
    countBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 10 },
    countText: { fontSize: 10, color: '#6b7280', fontWeight: 'bold' },
    emptyText: { textAlign: 'center', color: '#9ca3af', padding: 11, fontSize: 10 },

    // New Work Order Card Styles
    woCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 11,
        marginBottom: 11,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    woCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    woIndexBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    woIndexText: {
        fontSize: 10,
        color: '#6b7280',
        fontWeight: 'bold',
    },
    woCardTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#111827',
    },
    woDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    woDateText: {
        fontSize: 10,
        color: '#6b7280',
    },
    woValueBoxNew: {
        alignItems: 'flex-end',
        marginRight: 5,
    },
    woValueLabelNew: {
        fontSize: 10,
        color: '#9ca3af',
    },
    woValueAmountNew: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#f97316',
    },
    woExpandBtn: {
        width: 27,
        height: 27,
        borderRadius: 16,
        backgroundColor: '#f9fafb',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    woDivider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginVertical: 8,
    },
    woDetailsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 11,
    },
    woInfoBit: {
        flex: 1,
    },
    woInfoLabel: {
        fontSize: 10,
        color: '#9ca3af',
        marginBottom: 2,
    },
    woInfoValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#111827',
    },
    woActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 8,
        gap: 8,
        flexWrap: 'wrap',
    },
    btnFillForm: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 8,
    },
    btnFillFormText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    btnUploadBG: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f97316',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    btnUploadBGText: {
        color: '#f97316',
        fontSize: 10,
        fontWeight: '600',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 14,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '100%',
        maxWidth: 425,
        maxHeight: '80%',
        overflow: 'hidden',
        flexShrink: 1,
    },
    modalHeader: {
        backgroundColor: '#c1272d',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 11,
        gap: 8,
    },
    modalHeaderIcon: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalSubtitle: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    modalIconBoxGreen: {
        width: 37,
        height: 37,
        borderRadius: 8,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        flexShrink: 1,
    },
    fieldContainer: {
        gap: 5,
    },
    fieldLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fieldLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6b7280',
    },
    fieldValueBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        gap: 8,
    },
    fieldIconBox: {
        width: 27,
        height: 27,
        borderRadius: 6,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    fieldValueText: {
        fontSize: 11,
        color: '#4b5563',
        flex: 1,
    },
    dropdownBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        justifyContent: 'space-between',
    },
    dropdownText: {
        fontSize: 11,
        color: '#4b5563',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 11,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: 11,
    },
    btnCancel: {
        paddingVertical: 5,
        paddingHorizontal: 8,
    },
    btnCancelText: {
        fontSize: 11,
        color: '#6b7280',
        fontWeight: '600',
    },
    btnSaveNext: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#c1272d',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
        gap: 5,
    },
    btnSaveNextText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },

    // Form Field Styles
    formGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    formField: {
        width: isMobile ? '100%' : '50%',
        paddingHorizontal: 5,
        marginBottom: 11,
    },
    formLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: '#4b5563',
        marginBottom: 5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        backgroundColor: '#fff',
        paddingHorizontal: 8,
    },
    inputIcon: {
        marginRight: 7,
    },
    input: {
        flex: 1,
        paddingVertical: 7,
        fontSize: 12,
        color: '#111827',
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 7,
    },
    dropdownValue: {
        fontSize: 12,
        color: '#111827',
    },
    sectionDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 8,
        marginBottom: 14,
        gap: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sectionBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#3b82f6',
    },

    // Photo Upload Styles
    photoUploadContainer: {
        marginTop: 11,
        paddingHorizontal: 5,
    },
    photoUploadBox: {
        width: 102,
        height: 102,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        marginTop: 5,
    },
    photoUploadIcon: {
        marginBottom: 5,
    },
    photoUploadText: {
        fontSize: 10,
        color: '#9ca3af',
    },
    coordinateContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 5,
        paddingVertical: 8,
        gap: 2,
    },
    coordinateLabel: {
        fontSize: 10,
        color: '#6b7280',
    },
    coordinateInput: {
        flex: 1,
        fontSize: 12,
        color: '#111827',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingVertical: 2,
    },
    btnUploadMaterial: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        paddingHorizontal: 11,
        borderRadius: 8,
        backgroundColor: '#ecfdf5',
        borderWidth: 1,
        borderColor: '#10b981',
        justifyContent: 'center',
    },
    btnUploadMaterialText: {
        color: '#059669',
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    materialForm: {
        padding: 11,
        gap: 11,
    },
    fileList: {
        marginTop: 8,
    },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 7,
        borderRadius: 8,
        marginBottom: 5,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    fileName: {
        flex: 1,
        fontSize: 10,
        color: '#4b5563',
        marginLeft: 5,
    },
    btnPickFiles: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderStyle: 'dashed',
        backgroundColor: '#f9fafb',
    },
    btnPickFilesText: {
        fontSize: 11,
        color: '#6b7280',
        fontWeight: '500',
        marginLeft: 5,
    },
    // Style refinements for Upload and Buttons
    btnActionRow: {
        flexDirection: 'row',
        gap: 5,
        marginTop: 5,
    },
    btnActionPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        paddingVertical: 7,
        borderRadius: 8,
        gap: 4,
    },
    btnActionPrimaryText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    btnActionSecondary: {
        flex: 1.2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ecfdf5',
        borderWidth: 1,
        borderColor: '#10b981',
        paddingVertical: 7,
        borderRadius: 8,
        gap: 4,
    },
    btnActionSecondaryText: {
        color: '#059669',
        fontSize: 10,
        fontWeight: 'bold',
    },
    // Uploaded Documents in Work Order
    uploadedDocsContainer: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    uploadedDocsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 7,
    },
    uploadedDocsTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#374151',
    },
    uploadedDocItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 5,
        borderRadius: 6,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 5,
    },
    uploadedDocName: {
        flex: 1,
        fontSize: 10,
        color: '#4b5563',
    },
    // Back arrow for form
    btnBackArrow: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: '#c1272d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // File list refinements
    filePreview: {
        width: 34,
        height: 34,
        borderRadius: 4,
        backgroundColor: '#f3f4f6',
    },
    fileIconBox: {
        width: 34,
        height: 34,
        borderRadius: 4,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileStatus: {
        fontSize: 10,
        color: '#059669',
        marginTop: 2,
    },
    removeFileBtn: {
        padding: 5,
    },
    // Selection Wide Modal
    selectionContentWide: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '90%',
        maxWidth: 340,
        padding: 14,
    },
    sourceGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
    },
    sourceItem: {
        alignItems: 'center',
        gap: 8,
    },
    sourceIconBox: {
        width: 47,
        height: 47,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
    },
    sourceText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#4b5563',
    },
    sourceCancelBtn: {
        paddingVertical: 8,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        marginTop: 5,
    },
    sourceCancelText: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '600',
    },
    woActionRow: {
        flexDirection: 'row',
        gap: 5,
        marginBottom: 8,
    },
    // Selection Modal Styles (Restored)
    selectionOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    selectionContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '60%',
    },
    selectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    selectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    selectionScroll: {
        padding: 7,
    },
    selectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 11,
        borderRadius: 8,
    },
    selectionText: {
        fontSize: 12,
        color: '#4b5563',
    },
    selectionTextSelected: {
        color: '#c1272d',
        fontWeight: 'bold',
    },
    woAssetsContainer: {
        marginTop: 11,
        gap: 8,
    },
    woAssetsTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 5,
    },
    woAssetCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    woAssetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 8,
    },
    woAssetName: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1f2937',
        flex: 1,
    },
    btnActionRowAsset: {
        flexDirection: 'row',
        gap: 4,
        flexWrap: 'wrap',
        flex: 1,
        justifyContent: 'flex-end',
    },
    btnActionSecondaryAsset: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ecfdf5',
        borderWidth: 1,
        borderColor: '#10b981',
        paddingVertical: 4,
        paddingHorizontal: 5,
        borderRadius: 6,
        gap: 2,
        minWidth: 76,
    },
    btnActionSecondaryTextAsset: {
        color: '#059669',
        fontSize: 10,
        fontWeight: 'bold',
    },
    btnActionPrimaryAsset: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        paddingVertical: 4,
        paddingHorizontal: 5,
        borderRadius: 6,
        gap: 2,
        minWidth: 76,
    },
    btnActionPrimaryTextAsset: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    btnUploadBGAsset: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f97316',
        paddingVertical: 5,
        paddingHorizontal: 2,
        borderRadius: 6,
        gap: 2,
    },
    btnUploadBGTextAsset: {
        color: '#f97316',
        fontSize: 10,
        fontWeight: '600',
    },
    emptyAssetsText: {
        fontSize: 10,
        color: '#9ca3af',
        fontStyle: 'italic',
        marginTop: 5,
    },
    fileItemBg: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        backgroundColor: '#ecfdf5',
        borderRadius: 6,
        marginTop: 4,
        gap: 4,
    },
    fileNameBg: {
        fontSize: 10,
        color: '#059669',
        flex: 1,
    },
    bgSectionContainer: {
        padding: 8,
        backgroundColor: '#fff',
    },
    bgSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 7,
    },
    btnAddBGHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingVertical: 2,
        paddingHorizontal: 5,
        borderRadius: 4,
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#3b82f6',
    },
    btnAddBGHeaderText: {
        fontSize: 10,
        color: '#3b82f6',
        fontWeight: 'bold',
    },
    emptyBGCard: {
        padding: 8,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#d1d5db',
        alignItems: 'center',
    },
    emptyBGText: {
        fontSize: 10,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    bgListContainer: {
        gap: 5,
    },
    bgItemCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 6,
        padding: 7,
        borderLeftWidth: 3,
        borderLeftColor: '#3b82f6',
        shadowColor: '#000',
    },
    bgItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    bgBankName: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1e293b',
        flex: 1,
    },
    bgAmount: {
        fontSize: 11,
        fontWeight: '800',
        color: '#10b981',
    },
    bgItemBody: {
        flexDirection: 'row',
        gap: 8,
    },
    bgDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    bgDetailText: {
        fontSize: 10,
        color: '#64748b',
    },
    woAssetCardEnhanced: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 8,
        shadowColor: '#000',
    },
    woAssetHeaderEnhanced: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        gap: 7,
        flexWrap: 'wrap',
    },
    assetIconBoxSmall: {
        width: 27,
        height: 27,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    woAssetNameEnhanced: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#111827',
        maxWidth: width * 0.4,
    },
    installationsListContainer: {
        marginTop: 5,
        paddingTop: 5,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    installationsListTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6b7280',
        marginBottom: 5,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    installationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 5,
        borderRadius: 6,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    installationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        flex: 1,
    },
    instBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    instBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4b5563',
    },
    instTitle: {
        fontSize: 10,
        fontWeight: '600',
        color: '#374151',
    },
    instDate: {
        fontSize: 10,
        color: '#9ca3af',
    },
    instStatusLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    instStatusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#4b5563',
    },
    btnEditInst: {
        padding: 2,
        marginLeft: 2,
    },
    emptyInstallText: {
        fontSize: 10,
        color: '#9ca3af',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 5,
    },
    // New Redesigned Styles
    woCardNew: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 11,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
    },
    woCardHeaderNew: {
        flexDirection: 'row',
        padding: 11,
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
    },
    woHeaderLeft: {
        flex: 1,
    },
    woHeaderTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    woHeaderId: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
    btnEditWO: {
        padding: 2,
        marginLeft: 5,
    },
    woHeaderDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginTop: 2,
    },
    woHeaderDate: {
        fontSize: 10,
        color: '#6b7280',
    },
    woHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
    },
    woValueContainer: {
        alignItems: 'flex-end',
    },
    woValueLabel: {
        fontSize: 10,
        color: '#9ca3af',
        fontWeight: '600',
    },
    woValueText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#f97316',
    },
    woExpandIconBox: {
        width: 27,
        height: 27,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    woContentNew: {
        padding: 11,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    woInfoGridNew: {
        flexDirection: 'row',
        paddingVertical: 11,
        gap: 22,
    },
    woInfoItemNew: {
        flex: 1,
    },
    woInfoLabelNew: {
        fontSize: 10,
        color: '#9ca3af',
        marginBottom: 2,
        fontWeight: '500',
    },
    woInfoValueNew: {
        fontSize: 12,
        color: '#111827',
        fontWeight: '700',
    },
    subSectionHeaderNew: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginVertical: 8,
    },
    subSectionIconBoxNew: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: '#fff7ed',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ffedd5',
    },
    subSectionTitleNew: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    assetCardNew: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#f2f2f2',
        marginBottom: 11,
    },
    assetHeaderNew: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 11,
        flexWrap: 'wrap',
        gap: 5,
    },
    assetNameNew: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#111827',
    },
    assetSubtextNew: {
        fontSize: 10,
        color: '#6b7280',
        marginTop: 2,
    },
    btnAddInstallationNew: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f97316',
    },
    btnAddInstallationText: {
        fontSize: 10,
        color: '#f97316',
        fontWeight: 'bold',
    },
    installationRowNew: {
        flexDirection: 'row',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        marginTop: 8,
        flexWrap: 'wrap',
        gap: 11,
    },
    installationDetails: {
        flex: 1,
        minWidth: 238,
        gap: 4,
    },
    instDetailLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    instDetailLineIndent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingLeft: 14,
    },
    instDetailLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4b5563',
    },
    instDetailValue: {
        fontSize: 10,
        color: '#6b7280',
        flexShrink: 1,
    },
    instDetailLineIndentNew: {
        paddingLeft: 12,
        marginTop: -2,
    },
    instDetailSubValueNew: {
        fontSize: 10,
        color: '#6b7280',
    },
    instStatusRow: {
        flexDirection: 'row',
        gap: 5,
        marginTop: 5,
    },
    statusBadgeInstalled: {
        backgroundColor: '#ecfdf5',
        paddingVertical: 2,
        paddingHorizontal: 5,
        borderRadius: 12,
    },
    statusBadgeApproved: {
        backgroundColor: '#ecfdf5',
        paddingVertical: 2,
        paddingHorizontal: 5,
        borderRadius: 12,
    },
    statusBadgePending: {
        backgroundColor: '#fff7ed',
        paddingVertical: 2,
        paddingHorizontal: 5,
        borderRadius: 12,
    },
    statusBadgeTextGreen: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#059669',
    },
    statusBadgeTextOrange: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#f97316',
    },
    instActionBtnRow: {
        flexDirection: 'row',
        gap: 5,
        marginTop: 8,
        flexWrap: 'wrap',
    },
    btnApproveInst: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#059669',
        paddingVertical: 2,
        paddingHorizontal: 5,
        borderRadius: 4,
    },
    btnRejectInst: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#dc2626',
        paddingVertical: 2,
        paddingHorizontal: 5,
        borderRadius: 4,
    },
    btnActionTextWhite: {
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold',
    },
    installationActions: {
        flex: 1,
        minWidth: 187,
        alignItems: 'flex-start',
        gap: 8,
    },
    instMainActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    btnAssetMaterial: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingVertical: 4,
        paddingHorizontal: 5,
    },
    btnAssetPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#059669',
    },
    btnActionTextGreen: {
        fontSize: 10,
        color: '#059669',
        fontWeight: 'bold',
    },
    btnAssetModify: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingVertical: 4,
        paddingHorizontal: 11,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#f97316',
    },
    btnActionTextOrange: {
        fontSize: 10,
        color: '#f97316',
        fontWeight: 'bold',
    },
    btnAssetUpload: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#3b82f6',
    },
    btnActionTextBlue: {
        fontSize: 10,
        color: '#3b82f6',
        fontWeight: 'bold',
    },
    instSubActionsRow: {
        marginTop: 2,
        gap: 7,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    instFillUploadContainer: {
        flexDirection: 'row',
        gap: 5,
        flexWrap: 'wrap',
    },
    btnAssetFill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: '#3b82f6',
        minWidth: 68,
        justifyContent: 'center',
    },
    bgCardNew: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#f2f2f2',
        marginBottom: 8,
    },
    bgCardMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    bgInfoLeft: {
        flex: 1,
    },
    bgBankNameNew: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#111827',
    },
    bgNumberNew: {
        fontSize: 10,
        color: '#6b7280',
        marginTop: 2,
    },
    bgInfoRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bgValueColumn: {
        alignItems: 'flex-end',
    },
    bgValueLabelNew: {
        fontSize: 10,
        color: '#9ca3af',
        fontWeight: '600',
    },
    bgValueTextNew: {
        fontSize: 14,
        fontWeight: '900',
        color: '#f97316',
    },
    btnBGIcon: {
        padding: 2,
    },
    btnBGIconUpload: {
        padding: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ffedd5',
        borderStyle: 'dashed',
        backgroundColor: '#fff',
    },
    bgDatesGrid: {
        flexDirection: 'row',
        paddingTop: 8,
    },
    bgDateItem: {
        flex: 1,
    },
    bgDateLabel: {
        fontSize: 10,
        color: '#9ca3af',
        marginBottom: 2,
    },
    bgDateText: {
        fontSize: 10,
        color: '#111827',
        fontWeight: '600',
    },
    woBottomActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 11,
        marginTop: 11,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        flexWrap: 'wrap',
        gap: 8,
    },
    btnUploadBGMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f97316',
    },
    btnUploadBGMainText: {
        fontSize: 10,
        color: '#f97316',
        fontWeight: 'bold',
    },
    woFooterBtns: {
        flexDirection: 'row',
        gap: 8,
    },
    btnWOSecondary: {
        backgroundColor: '#dc2626',
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 10,
    },
    btnWOSecondaryText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    btnWOPrimary: {
        backgroundColor: '#059669',
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 10,
    },
    btnWOPrimaryText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // Missing Installation Styles
    instDocList: {
        marginTop: 7,
        backgroundColor: '#fdf2f2',
        borderRadius: 8,
        padding: 5,
        gap: 4,
    },
    instDocItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 5,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#fee2e2',
        gap: 5,
    },
    instDocName: {
        flex: 1,
        fontSize: 10,
        color: '#b91c1c',
    },
});


const TenderDetailsScreen = ({ route, navigation }: any) => {
    const { tenderId } = route.params;
    const [tender, setTender] = useState<Tender | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFormModalVisible, setIsFormModalVisible] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isCapturingLocation, setIsCapturingLocation] = useState(false);
    const [expandedWOIds, setExpandedWOIds] = useState<number[]>([]);

    // Selection Modal State
    const [isSelectionModalVisible, setIsSelectionModalVisible] = useState(false);
    const [selectionData, setSelectionData] = useState<DropdownItem[]>([]);
    const [selectionTitle, setSelectionTitle] = useState('');
    const [selectionKey, setSelectionKey] = useState('');

    // Raw Material Upload State
    const [isMaterialModalVisible, setIsMaterialModalVisible] = useState(false);
    const [materialFiles, setMaterialFiles] = useState<any[]>([]);
    const [materialAssetId, setMaterialAssetId] = useState<number | null>(null);
    const [materialAssetTypeId, setMaterialAssetTypeId] = useState<number | null>(null);
    const [materialAssetSubTypeId, setMaterialAssetSubTypeId] = useState<number | null>(null);
    const [materialWorkOrderInstalledAssetId, setMaterialWorkOrderInstalledAssetId] = useState<number | null>(null);
    const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
    // Dropdown Data
    const [districts, setDistricts] = useState<DropdownItem[]>([]);
    const [blocks, setBlocks] = useState<DropdownItem[]>([]);
    const [gps, setGps] = useState<DropdownItem[]>([]);
    const [villages, setVillages] = useState<DropdownItem[]>([]);

    // Bank Guarantee State
    const [isBGModalVisible, setIsBGModalVisible] = useState(false);
    const [isSubmittingBGs, setIsSubmittingBGs] = useState(false);
    const [bgFormData, setBgFormData] = useState({
        bankName: '',
        bgNumber: '',
        amount: '',
        issueDate: '',
        expiryDate: '',
        document: null as any
    });

    // Date Picker State for BG
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerTarget, setDatePickerTarget] = useState<'issueDate' | 'expiryDate' | null>(null);

    // Form Data State
    const [formData, setFormData] = useState({
        // Step 0: Initial
        assetId: '',
        // Step 1: Beneficiary (A)
        fullName: '',
        fatherName: '',
        phoneNumber: '',
        altPhoneNumber: '',
        email: '',
        gender: '',
        ses: '',
        caste: '',
        beneficiaryPhoto: null as any,
        // Step 2 & 4: Location (B & 4)
        stateId: 1,
        districtId: null as number | null,
        blockId: null as number | null,
        gpId: null as number | null,
        villageId: null as number | null,
        habitation: '',
        pinCode: '',
        houseNo: '',
        areaLocality: '',
        streetLandmark: '',
        latitude: '',
        longitude: '',
        // Step 3: Technical (3)
        capacity: '',
        cmcPeriod: '',
        installationClass: '',
        dateOfInstallation: '',
        dateOfCommissioning: '',
        // Step 5: Documents Upload
        installationPhoto: null as any,
        installationCertificate: null as any,
        jccDocument: null as any,
        // Step 6: Component Asset Details
        componentValues: [] as any[],
    });

    const fetchDetails = async () => {
        try {
            const response = await tenderService.getTenderById(tenderId);
            setTender(response.Data);
        } catch (error) {
            console.error('Error fetching tender details:', error);
            Alert.alert('Error', 'Failed to fetch tender details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [tenderId]);

    // Fetch Dropdowns
    useEffect(() => {
        const fetchDistricts = async () => {
            const res = await projectAssetService.getDistricts(1);
            setDistricts(res.Data);
        };
        if (isFormModalVisible) fetchDistricts();
    }, [isFormModalVisible]);

    useEffect(() => {
        const fetchBlocks = async () => {
            if (formData.districtId) {
                const res = await projectAssetService.getBlocks(formData.districtId);
                setBlocks(res.Data);
            }
        };
        fetchBlocks();
    }, [formData.districtId]);

    useEffect(() => {
        const fetchGps = async () => {
            if (formData.blockId) {
                const res = await projectAssetService.getGramPanchayats(formData.blockId);
                setGps(res.Data);
            }
        };
        fetchGps();
    }, [formData.blockId]);

    useEffect(() => {
        const fetchVillages = async () => {
            if (formData.gpId) {
                const res = await projectAssetService.getVillages(formData.gpId);
                setVillages(res.Data);
            }
        };
        fetchVillages();
    }, [formData.gpId]);


    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera access is required to take photos.');
            return false;
        }
        return true;
    };

    // File Source Modal State
    const [isFileSourceVisible, setIsFileSourceVisible] = useState(false);
    const [onFileSourceSelected, setOnFileSourceSelected] = useState<(asset: any) => void>(() => () => { });
    const [allowSourceDocuments, setAllowSourceDocuments] = useState(false);

    const handleTakePhoto = async (onFileSelected: (asset: any) => void) => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        try {
            console.log('Launching camera...');
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false, // Disabled to fix capture issues
                quality: 0.8,
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                console.log('Camera Asset Selected:', asset);
                onFileSelected({
                    uri: asset.uri,
                    name: asset.fileName || `photo_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                    mimeType: 'image/jpeg',
                });
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to capture photo');
        }
    };

    const handlePickFromGallery = async (onFileSelected: (asset: any) => void) => {
        try {
            console.log('Launching gallery...');
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false, // Disabled for reliability
                quality: 0.8,
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                console.log('Gallery Asset Selected:', asset);
                onFileSelected({
                    uri: asset.uri,
                    name: asset.fileName || `image_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                    mimeType: 'image/jpeg',
                });
            }
        } catch (error) {
            console.error('Error picking from gallery:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleAddFileChoice = (onFileSelected: (asset: any) => void, allowDocuments = false) => {
        setOnFileSourceSelected(() => onFileSelected);
        setAllowSourceDocuments(allowDocuments);
        setIsFileSourceVisible(true);
    };

    const updateBgFormData = (key: string, value: any) => {
        setBgFormData(prev => ({ ...prev, [key]: value }));
    };

    const onBgDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate && datePickerTarget) {
            const day = selectedDate.getDate().toString().padStart(2, '0');
            const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
            const year = selectedDate.getFullYear();
            const dateString = `${day}/${month}/${year}`;
            updateBgFormData(datePickerTarget, dateString);
        }
        setDatePickerTarget(null);
    };

    const handleUploadBG = async (wo: WorkOrder) => {
        setSelectedWorkOrder(wo);
        // Reset form but keep existing BGs
        setBgFormData({
            bankName: '',
            bgNumber: '',
            amount: '',
            issueDate: '',
            expiryDate: '',
            document: null as any
        });
        setIsBGModalVisible(true);
    };

    const handleAddBGDocument = () => {
        handleAddFileChoice((asset) => {
            updateBgFormData('document', asset);
        }, true);
    };

    const handleSubmitBGs = async () => {
        if (!selectedWorkOrder) return;
        if (!bgFormData.bankName || !bgFormData.bgNumber || !bgFormData.amount || !bgFormData.issueDate || !bgFormData.expiryDate || !bgFormData.document) {
            Alert.alert('Error', 'Please fill all required fields and choose a document.');
            return;
        }

        setIsSubmittingBGs(true);
        try {
            // Parse DD/MM/YYYY to Date object
            const [iDay, iMonth, iYear] = bgFormData.issueDate.split('/').map(Number);
            const [eDay, eMonth, eYear] = bgFormData.expiryDate.split('/').map(Number);

            const issueDateObj = new Date(iYear, iMonth - 1, iDay);
            const expiryDateObj = new Date(eYear, eMonth - 1, eDay);

            await workOrderService.uploadBankGuarantee(selectedWorkOrder.Id, {
                BankName: bgFormData.bankName,
                BGNumber: bgFormData.bgNumber,
                IssueDate: issueDateObj.toISOString(),
                ExpiryDate: expiryDateObj.toISOString(),
                Amount: parseFloat(bgFormData.amount) || 0,
                Document: bgFormData.document
            });

            Alert.alert('Success', 'Bank Guarantee submitted successfully!');
            setIsBGModalVisible(false);
            
            // Refresh tender data to show the new BG
            fetchDetails();
        } catch (error) {
            console.error('Error submitting BG:', error);
            Alert.alert('Error', 'Failed to submit Bank Guarantee');
        } finally {
            setIsSubmittingBGs(false);
        }
    };

    const pickMaterialFiles = async () => {
        handleAddFileChoice((asset) => {
            setMaterialFiles(prev => [...prev, asset]);
        }, true);
    };

    const removeMaterialFile = (index: number) => {
        setMaterialFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleMaterialUpload = async () => {
        if (!selectedWorkOrder) return;

        // Use 0 or null as fallback for optional IDs if they are null
        const assetId = materialAssetId || 0;
        const assetTypeId = materialAssetTypeId || 0;
        const assetSubTypeId = (materialAssetSubTypeId === 0 || !materialAssetSubTypeId) ? null : materialAssetSubTypeId;

        if (materialFiles.length === 0) {
            Alert.alert('Error', 'Please select at least one file');
            return;
        }

        setIsUploadingMaterial(true);
        try {
            await workOrderService.uploadRawMaterial(selectedWorkOrder.Id, {
                AssetId: assetId,
                AssetTypeId: assetTypeId,
                AssetSubTypeId: assetSubTypeId,
                WorkOrderInstalledAssetId: materialWorkOrderInstalledAssetId,
                Files: materialFiles,
            });

            Alert.alert('Success', 'Material verification submitted successfully');
            setIsMaterialModalVisible(false);
            setMaterialFiles([]);
            setMaterialAssetId(null);
            setMaterialAssetTypeId(null);
            setMaterialAssetSubTypeId(null);
            setMaterialWorkOrderInstalledAssetId(null);
            
            // Refresh tender data to show the new material verification status
            fetchDetails();
        } catch (error) {
            console.error('Error uploading material:', error);
            Alert.alert('Error', 'An error occurred while uploading material');
        } finally {
            setIsUploadingMaterial(false);
        }
    };

    const handleOpenMaterialUpload = (wo: WorkOrder, asset: any, ia?: any) => {
        setSelectedWorkOrder(wo);
        setMaterialAssetId(asset.AssetId || (asset.Id as any));
        setMaterialWorkOrderInstalledAssetId(ia?.Id || null);
        // Find asset details from tender to get type and subtype
        const tenderAsset = tender?.Assets?.find(a => (a.AssetId || a.Id) === (asset.AssetId || (asset.Id as any)));
        if (tenderAsset && tenderAsset.AssetType?.[0]) {
            setMaterialAssetTypeId(tenderAsset.AssetType[0].Id || 0);
            setMaterialAssetSubTypeId(tenderAsset.AssetType[0].AssetSubType?.[0]?.Id || 0);
        } else {
            setMaterialAssetTypeId(0);
            setMaterialAssetSubTypeId(0);
        }
        setMaterialFiles([]);
        setIsMaterialModalVisible(true);
    };

    const toggleWorkOrder = (id: number) => {
        setExpandedWOIds(prev =>
            prev.includes(id) ? prev.filter(woId => woId !== id) : [...prev, id]
        );
    };

    const handleFillForm = (wo: WorkOrder) => {
        setSelectedWorkOrder(wo);
        setCurrentStep(0);
        setIsFormModalVisible(true);
    };

    const handleAddInstallationRow = async (wo: WorkOrder, asset: any) => {
        try {
            setLoading(true);
            const assetId = asset.AssetId || asset.Id;
            const response = await workOrderService.addWorkOrderInstallation(wo.Id, assetId);
            
            if (response && response.DeveloperMessage && response.DeveloperMessage.includes('successfully')) {
                await fetchDetails();
                Alert.alert('Success', 'Installation instance added successfully.');
            } else {
                Alert.alert('Error', response.DisplayMessage || 'Failed to add installation instance.');
            }
        } catch (error) {
            console.error('Error adding installation:', error);
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleNextStep = async () => {
        if (!tender) return;

        try {
            // Save draft at each step
            const draftData: any = {
                Id: 0,
                ProjectId: tender.Id,
                WorkOrderId: selectedWorkOrder?.Id,
                AssetId: formData.assetId,
                CurrentStep: currentStep + 1,
            };

            // Map form data to steps based on API structure
            if (currentStep === 0) {
                draftData.Step1 = {
                    ProjectId: tender.Id,
                    WorkOrderId: selectedWorkOrder?.Id,
                    AssetId: formData.assetId,
                };
            } else if (currentStep === 3) {
                draftData.Step3 = {
                    DateOfInstallation: formData.dateOfInstallation,
                    DateOfCommissioning: formData.dateOfCommissioning,
                    CmcPeriodInYears: parseInt(formData.cmcPeriod) || 0,
                    InstallationClass: formData.installationClass,
                    Capacity: parseFloat(formData.capacity) || 0
                };
            } else if (currentStep === 4) {
                draftData.Step4 = {
                    StateId: formData.stateId,
                    DistrictId: formData.districtId,
                    BlockId: formData.blockId,
                    GramPanchayatId: formData.gpId,
                    VillageId: formData.villageId,
                    PinCode: formData.pinCode,
                    Latitude: parseFloat(formData.latitude) || 0,
                    Longitude: parseFloat(formData.longitude) || 0,
                    IsPrimary: true
                };
            } else if (currentStep === 5) {
                draftData.Step5 = {
                    InstallationPhoto: formData.installationPhoto,
                    InstallationCertificate: formData.installationCertificate,
                    JccDocument: formData.jccDocument,
                };
            } else if (currentStep === 6) {
                draftData.Step6 = {
                    ComponentValues: formData.componentValues,
                };
            }

            // await projectAssetService.saveDraft(draftData);

            if (currentStep < 6) {
                setCurrentStep(currentStep + 1);
            } else {
                Alert.alert('Success', 'Project Asset Initiation Complete');
                setIsFormModalVisible(false);
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            Alert.alert('Error', 'Failed to save progress');
        }
    };

    const handleGetCurrentLocation = async () => {
        setIsCapturingLocation(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Permission to access location was denied');
                setIsCapturingLocation(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const lat = location.coords.latitude.toString();
            const lon = location.coords.longitude.toString();

            updateFormData('latitude', lat);
            updateFormData('longitude', lon);

            Alert.alert(
                'Location Captured',
                `Latitude: ${lat}\nLongitude: ${lon}`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'Failed to capture location');
        } finally {
            setIsCapturingLocation(false);
        }
    };

    const updateFormData = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const renderFormField = (label: string, key: string, icon: any, placeholder: string = '', required: boolean = false) => (
        <View style={styles.formField}>
            <Text style={styles.formLabel}>{label}{required && <Text style={{ color: '#dc2626' }}> *</Text>}</Text>
            <View style={styles.inputWrapper}>
                {icon && <View style={styles.inputIcon}>{icon}</View>}
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    value={(formData as any)[key]}
                    onChangeText={(text) => updateFormData(key, text)}
                />
            </View>
        </View>
    );

    const renderDropdownField = (label: string, key: string, data: DropdownItem[], icon: any, required: boolean = false, disabled: boolean = false) => {
        const selectedItem = data.find(item => item.Id === (formData as any)[key]);

        const openSelection = () => {
            if (disabled) return;
            if (data.length === 0) {
                Alert.alert('Info', `No ${label} available`);
                return;
            }
            setSelectionData(data);
            setSelectionTitle(`Select ${label}`);
            setSelectionKey(key);
            setIsSelectionModalVisible(true);
        };

        return (
            <View style={styles.formField}>
                <Text style={styles.formLabel}>{label}{required && <Text style={{ color: '#dc2626' }}> *</Text>}</Text>
                <TouchableOpacity
                    style={[styles.dropdownTrigger, disabled && { backgroundColor: '#f3f4f6' }]}
                    onPress={openSelection}
                    activeOpacity={disabled ? 1 : 0.7}
                >
                    <Text style={[styles.dropdownValue, disabled && { color: '#9ca3af' }]}>{selectedItem?.Name || `Select ${label}`}</Text>
                    <MaterialCommunityIcons name="unfold-more-horizontal" size={20} color="#9ca3af" />
                </TouchableOpacity>
            </View>
        );
    };

    const getModalHeader = () => {
        const titles = [
            { title: 'Initiate Project Asset', subtitle: 'Set up initial details' },
            { title: 'Initiate Project Asset', subtitle: 'Beneficiary & Location' },
            { title: 'Initiate Project Asset', subtitle: 'Beneficiary & Location' },
            { title: 'Initiate Project Asset', subtitle: 'Technical Details' },
            { title: 'Initiate Project Asset', subtitle: 'Inst. Location' },
            { title: 'Initiate Project Asset', subtitle: 'Documents Upload' },
            { title: 'Initiate Project Asset', subtitle: 'Component Asset Details' },
        ];
        return titles[currentStep] || titles[0];
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#dc2626" />
                </View>
            </View>
        );
    }

    if (!tender) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContainer}>
                    <Text>Tender not found</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
                        <Text style={{ color: '#dc2626' }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const totalWOValue = tender.WorkOrders?.reduce((sum, wo) => sum + (wo.WOValue || 0), 0) || 0;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
            >
                {/* Premium Header with Gradient */}
                <LinearGradient
                    colors={['#8b1a1a', '#c52525', '#e23f3f']}
                    style={styles.headerGradient}
                >
                    <SafeAreaView edges={['top', 'left', 'right']}>
                        <View style={styles.headerContent}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                                activeOpacity={0.7}
                            >
                                <Feather name='arrow-left' size={24} color='#fff' />
                            </TouchableOpacity>
                            <View style={styles.headerTitleContainer}>
                                <Text style={styles.headerTitle} numberOfLines={2}>{tender.TenderNumber || 'Tender Details'}</Text>
                                <View style={styles.headerBadge}>
                                    <MaterialCommunityIcons name='folder-outline' size={14} color='#fff' opacity={0.8} />
                                    <Text style={styles.headerBadgeText}>
                                        {tender.ProjectName || 'Project'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                <View style={styles.headerActionsContainer}>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.btnOutlineOrange}>
                            <Text style={styles.btnOutlineTextOrange}>Assign Work Order</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnSolidRed}>
                            <Text style={styles.btnSolidText}>Assign LOI</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Statistics Cards - 2 per row */}
                <View style={styles.statsContainer}>
                    {/* Row 1: LOI and Work Orders */}
                    <View style={styles.statsRowWrapper}>
                        <View style={[styles.statCard, { borderLeftColor: '#fecaca', borderLeftWidth: 4 }]}>
                            <View style={styles.statIconBoxRed}>
                                <MaterialIcons name="description" size={20} color="#dc2626" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.statLabel}>Letters of Intent</Text>
                                <Text style={styles.statSubLabel}>Total LOIs assigned</Text>
                            </View>
                            <Text style={styles.statValue}>{tender.LOIs?.length || 0}</Text>
                        </View>

                        <View style={[styles.statCard, { borderLeftColor: '#fed7aa', borderLeftWidth: 4 }]}>
                            <View style={styles.statIconBoxOrange}>
                                <MaterialIcons name="work" size={20} color="#f97316" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.statLabel}>Work Orders</Text>
                                <Text style={styles.statSubLabel}>Active work orders</Text>
                            </View>
                            <Text style={styles.statValue}>{tender.WorkOrders?.length || 0}</Text>
                        </View>
                    </View>

                    {/* Row 2: Total Value and Bank Guarantee */}
                    <View style={styles.statsRowWrapper}>
                        <View style={[styles.statCard, { borderLeftColor: '#bbf7d0', borderLeftWidth: 4 }]}>
                            <View style={styles.statIconBoxGreen}>
                                <MaterialIcons name="currency-rupee" size={20} color="#16a34a" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.statLabel}>Total Value</Text>
                                <Text style={styles.statSubLabel}>Combined WO value</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.statValue, { color: '#16a34a' }]}>{totalWOValue}</Text>
                                <Text style={styles.statUnit}>Cr</Text>
                            </View>
                        </View>

                        <View style={[styles.statCard, { borderLeftColor: '#bfdbfe', borderLeftWidth: 4 }]}>
                            <View style={styles.statIconBoxBlue}>
                                <MaterialIcons name="account-balance" size={20} color="#3b82f6" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.statLabel}>Bank Guarantees</Text>
                                <Text style={styles.statSubLabel}>Total BG amount</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.statValue, { color: '#3b82f6' }]}>0</Text>
                                <Text style={styles.statUnit}>Cr</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Info & Sidebar Container */}
                <View style={styles.contentGrid}>
                    {/* Main Content Column */}
                    <View style={styles.mainColumn}>
                        {/* Tender Information */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIconBoxRed}>
                                    <Feather name="info" size={16} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.sectionTitle}>Tender Information</Text>
                                    <Text style={styles.sectionSubtitle}>Complete tender details and timeline</Text>
                                </View>
                            </View>
                            <View style={styles.infoGrid}>
                                <InfoItem label="Tender Number" value={tender.TenderNumber} icon="#" />
                                <InfoItem label="Project Name" value={tender.ProjectName} icon={<Feather name="folder" size={14} color="#6b7280" />} />
                                <InfoItem label="Start Date" value={formatDate(tender.TenderStartDate)} icon={<Feather name="calendar" size={14} color="#6b7280" />} />
                                <InfoItem label="End Date" value={formatDate(tender.TenderEndDate)} icon={<Feather name="calendar" size={14} color="#6b7280" />} />
                                <InfoItem label="Validity Date" value={formatDate(tender.TenderValidityDate)} icon={<Feather name="clock" size={14} color="#6b7280" />} />
                                <InfoItem label="Created On" value={formatDate(tender.CreatedOn)} icon={<Feather name="calendar" size={14} color="#6b7280" />} />
                            </View>
                        </View>

                        {/* Documents Section */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIconBoxRed}>
                                    <MaterialIcons name="description" size={16} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.sectionTitle}>Documents</Text>
                                    <Text style={styles.sectionSubtitle}>Tender documents and attachments</Text>
                                </View>
                            </View>
                            {tender.Documents && tender.Documents.length > 0 ? (
                                tender.Documents.map((doc, index) => (
                                    <View key={index} style={styles.documentItem}>
                                        <View style={styles.docIconBox}>
                                            <MaterialIcons name="insert-drive-file" size={20} color="#dc2626" />
                                        </View>
                                        <Text style={styles.docName} numberOfLines={1}>{doc.FileName}</Text>
                                        <View style={styles.docActions}>
                                            <TouchableOpacity style={styles.docActionBtn}>
                                                <Feather name="eye" size={14} color="#3b82f6" />
                                                <Text style={[styles.docActionText, { color: '#3b82f6' }]}> View</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.docDownloadBtn}>
                                                <Feather name="download" size={14} color="#16a34a" />
                                                <Text style={[styles.docActionText, { color: '#16a34a' }]}> Download</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No documents found</Text>
                            )}
                        </View>

                        {/* Letters of Intent */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIconBoxRed}>
                                    <MaterialIcons name="assignment" size={16} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.sectionTitle}>Letters of Intent</Text>
                                    <Text style={styles.sectionSubtitle}>LOI assignments</Text>
                                </View>
                            </View>
                            <View style={styles.emptyPlaceholderCard}>
                                <View style={styles.emptyPlaceholderIconBox}>
                                    <MaterialIcons name="assignment" size={20} color="#dc2626" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.placeholderTitle}>No LOIs assigned</Text>
                                    <Text style={styles.placeholderSubtitle}>Assign the first LOI to continue</Text>
                                </View>
                                <TouchableOpacity style={styles.btnSolidRedSm}>
                                    <Text style={styles.btnSolidTextSm}>Assign LOI</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Work Orders */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIconBoxOrange}>
                                    <MaterialIcons name="work" size={16} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.sectionTitle}>Work Orders</Text>
                                    <Text style={styles.sectionSubtitle}>Work order details & BG</Text>
                                </View>
                            </View>
                            {tender.WorkOrders && tender.WorkOrders.length > 0 ? (
                                tender.WorkOrders.map((wo, index) => {
                                    const isExpanded = expandedWOIds.includes(wo.Id);
                                    return (
                                        <View key={wo.Id} style={styles.woCardNew}>
                                            <TouchableOpacity
                                                style={styles.woCardHeaderNew}
                                                onPress={() => toggleWorkOrder(wo.Id)}
                                                activeOpacity={0.8}
                                            >
                                                <View style={styles.woHeaderLeft}>
                                                    <View style={styles.woHeaderTitleRow}>
                                                        <MaterialCommunityIcons name="pound" size={18} color="#000" />
                                                        <Text style={styles.woHeaderId}>{wo.WONumber}</Text>
                                                        <TouchableOpacity style={styles.btnEditWO}>
                                                            <Feather name="edit" size={14} color="#3b82f6" />
                                                        </TouchableOpacity>
                                                    </View>
                                                    <View style={styles.woHeaderDateRow}>
                                                        <Feather name="calendar" size={12} color="#6b7280" />
                                                        <Text style={styles.woHeaderDate}>{formatDate(wo.WODate)}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.woHeaderRight}>
                                                   <View style={styles.woValueContainer}>
                                                        <Text style={styles.woValueLabel}>Value</Text>
                                                        <Text style={styles.woValueText}>₹ {wo.WOValue?.toLocaleString()}</Text>
                                                   </View>
                                                   <View style={styles.woExpandIconBox}>
                                                        <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#4b5563" />
                                                   </View>
                                                </View>
                                            </TouchableOpacity>

                                            {isExpanded && (
                                                <View style={styles.woContentNew}>
                                                    <View style={styles.woInfoGridNew}>
                                                        <View style={styles.woInfoItemNew}>
                                                            <Text style={styles.woInfoLabelNew}>Completion Due</Text>
                                                            <Text style={styles.woInfoValueNew}>{formatDate(wo.CompletionDueDate)}</Text>
                                                        </View>
                                                        <View style={styles.woInfoItemNew}>
                                                            <Text style={styles.woInfoLabelNew}>BG %</Text>
                                                            <Text style={styles.woInfoValueNew}>{wo.BGValuePercentage}%</Text>
                                                        </View>
                                                    </View>

                                                    <View style={styles.subSectionHeaderNew}>
                                                        <View style={styles.subSectionIconBoxNew}>
                                                             <MaterialCommunityIcons name="view-grid-outline" size={16} color="#f97316" />
                                                        </View>
                                                        <Text style={styles.subSectionTitleNew}>ASSETS ({wo.Assets?.length || 0})</Text>
                                                    </View>

                                                    {wo.Assets?.map((asset, aIdx) => {
                                                        const installedAssets = (wo as any).WorkOrderInstalledAssets?.filter((ia: any) => ia.AssetId === asset.AssetId) || [];
                                                        
                                                        return (
                                                            <View key={aIdx} style={styles.assetCardNew}>
                                                                <View style={styles.assetHeaderNew}>
                                                                    <View style={{ flex: 1 }}>
                                                                        <Text style={styles.assetNameNew}>{asset.AssetName}</Text>
                                                                        <Text style={styles.assetSubtextNew}>
                                                                            Type: {asset.AssetType?.[0]?.Name || 'N/A'} + Subtype: {asset.AssetType?.[0]?.AssetSubType?.[0]?.Name || 'N/A'}
                                                                        </Text>
                                                                    </View>
                                                                                                                                        <TouchableOpacity 
                                                                        style={styles.btnAddInstallationNew}
                                                                        onPress={() => handleAddInstallationRow(wo, asset)}
                                                                    >
                                                                        <Feather name="plus" size={14} color="#f97316" />
                                                                        <Text style={styles.btnAddInstallationText}>Add Installation</Text>
                                                                    </TouchableOpacity>
                                                                </View>

                                                                {installedAssets.length > 0 ? (
                                                                    installedAssets.map((ia: any, iaIdx: number) => (
                                                                        <View key={iaIdx} style={styles.installationRowNew}>
                                                                            <View style={styles.installationDetails}>
                                                                                <View style={styles.instDetailLine}>
                                                                                    <Feather name="user" size={12} color="#9ca3af" />
                                                                                    <Text style={styles.instDetailLabel}>Vendor: </Text>
                                                                                    <Text style={styles.instDetailValue}>{ia.VendorName}</Text>
                                                                                </View>
                                                                                <View style={styles.instDetailLine}>
                                                                                    <Feather name="user-check" size={12} color="#9ca3af" />
                                                                                    <Text style={styles.instDetailLabel}>Beneficiary Detail: </Text>
                                                                                    <Text style={styles.instDetailValue}>{ia.BeneficiaryName || 'No beneficiary assigned'}</Text>
                                                                                </View>
                                                                                {(ia.BeneficiaryPhone || ia.BeneficiaryEmail) && (
                                                                                    <View style={styles.instDetailLineIndentNew}>
                                                                                        <Text style={styles.instDetailSubValueNew}>
                                                                                            {ia.BeneficiaryPhone ? `${ia.BeneficiaryPhone} - ` : ''}
                                                                                            {ia.BeneficiaryEmail}
                                                                                        </Text>
                                                                                    </View>
                                                                                )}
                                                                                <View style={styles.instDetailLine}>
                                                                                    <Feather name="map-pin" size={12} color="#9ca3af" />
                                                                                    <Text style={styles.instDetailLabel}>Installation location(s): </Text>
                                                                                    <Text style={styles.instDetailValue}>
                                                                                        {ia.InstallationLocations?.length > 0 
                                                                                            ? ia.InstallationLocations.join(', ') 
                                                                                            : ia.InstallationLocation || 'N/A'
                                                                                        }
                                                                                    </Text>
                                                                                </View>
                                                                                
                                                                                </View>
                                                                                
                                                                                {ia.MaterialVerificationDocuments?.length > 0 && (
                                                                                    <View style={styles.instDocList}>
                                                                                        {ia.MaterialVerificationDocuments.map((doc: any, dIdx: number) => (
                                                                                            <TouchableOpacity 
                                                                                                key={dIdx} 
                                                                                                style={styles.instDocItem}
                                                                                                onPress={() => {
                                                                                                    let url = doc.FileUrl || doc.DocumentUrl;
                                                                                                    if (url) {
                                                                                                        if (!url.startsWith('http')) {
                                                                                                            const host = apiClient.getBaseHost();
                                                                                                            url = host + (url.startsWith('/') ? url.slice(1) : url);
                                                                                                        }
                                                                                                        Linking.openURL(url).catch(err => {
                                                                                                            console.error("Failed to open URL:", err);
                                                                                                            Alert.alert('Error', 'Could not open document.');
                                                                                                        });
                                                                                                    }
                                                                                                }}
                                                                                            >
                                                                                                <Feather name="file-text" size={10} color="#059669" />
                                                                                                <Text style={styles.instDocName} numberOfLines={1}>{doc.FileName}</Text>
                                                                                                <Feather name="external-link" size={10} color="#9ca3af" />
                                                                                            </TouchableOpacity>
                                                                                        ))}
                                                                                    </View>
                                                                                )}
                                                                                
                                                                                {ia.MaterialVerificationStatus === 'Pending' && (
                                                                                    <View style={styles.instActionBtnRow}>
                                                                                        <TouchableOpacity style={styles.btnApproveInst}>
                                                                                            <Feather name="check-circle" size={12} color="#fff" />
                                                                                            <Text style={styles.btnActionTextWhite}>Approve</Text>
                                                                                        </TouchableOpacity>
                                                                                        <TouchableOpacity style={styles.btnRejectInst}>
                                                                                            <Feather name="x-circle" size={12} color="#fff" />
                                                                                            <Text style={styles.btnActionTextWhite}>Reject</Text>
                                                                                        </TouchableOpacity>
                                                                                    </View>
                                                                                )}
 
                                                                            <View style={styles.installationActions}>
                                                                                <View style={styles.instMainActions}>
                                                                                    <TouchableOpacity 
                                                                                        style={styles.btnAssetMaterial}
                                                                                        onPress={() => handleOpenMaterialUpload(wo, asset, ia)}
                                                                                    >
                                                                                        <MaterialCommunityIcons name="circle-outline" size={14} color="#059669" />
                                                                                        <Text style={styles.btnActionTextGreen}>Raw Material</Text>
                                                                                    </TouchableOpacity>
                                                                                    <Feather name="info" size={14} color="#d1d5db" />
                                                                                    <TouchableOpacity 
                                                                                        style={styles.btnAssetPreview}
                                                                                        onPress={() => {
                                                                                            const doc = ia.MaterialVerificationDocuments?.[0];
                                                                                            let url = doc?.FileUrl || doc?.DocumentUrl;
                                                                                            if (url) {
                                                                                                if (!url.startsWith('http')) {
                                                                                                    const host = apiClient.getBaseHost();
                                                                                                    url = host + (url.startsWith('/') ? url.slice(1) : url);
                                                                                                }
                                                                                                Linking.openURL(url).catch(err => {
                                                                                                    console.error("Failed to open URL:", err);
                                                                                                    Alert.alert('Error', 'Could not open document.');
                                                                                                });
                                                                                            } else {
                                                                                                Alert.alert('Info', 'No material verification document available.');
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <Feather name="eye" size={14} color="#059669" />
                                                                                        <Text style={styles.btnActionTextGreen}>Preview</Text>
                                                                                    </TouchableOpacity>
                                                                                </View>
                                                                                
                                                                                <View style={styles.instSubActionsRow}>
                                                                                    {ia.MaterialVerificationStatus === 'Pending' && (
                                                                                        <TouchableOpacity style={styles.btnAssetModify}>
                                                                                            <MaterialCommunityIcons name="circle-edit-outline" size={14} color="#f97316" />
                                                                                            <Text style={styles.btnActionTextOrange}>Modify</Text>
                                                                                        </TouchableOpacity>
                                                                                    )}
                                                                                    {!ia.BeneficiaryName && (
                                                                                        <View style={styles.instFillUploadContainer}>
                                                                                            <TouchableOpacity 
                                                                                                style={styles.btnAssetUpload}
                                                                                                onPress={() => handleOpenMaterialUpload(wo, asset, ia)}
                                                                                            >
                                                                                                <Feather name="upload" size={14} color="#3b82f6" />
                                                                                                <Text style={styles.btnActionTextBlue}>Upload</Text>
                                                                                            </TouchableOpacity>
                                                                                            <TouchableOpacity 
                                                                                                style={styles.btnAssetFill}
                                                                                                onPress={() => {
                                                                                                    setFormData(prev => ({ ...prev, assetId: asset.AssetId || (asset.Id as any) }));
                                                                                                    handleFillForm(wo);
                                                                                                }}
                                                                                            >
                                                                                                <Feather name="edit-3" size={14} color="#fff" />
                                                                                                <Text style={styles.btnActionTextWhite}>Fill Form</Text>
                                                                                            </TouchableOpacity>
                                                                                        </View>
                                                                                    )}
                                                                                </View>
                                                                            </View>
                                                                        </View>
                                                                    ))
                                                                ) : (
                                                                    <Text style={styles.emptyInstallText}>No installations found.</Text>
                                                                )}
                                                            </View>
                                                        );
                                                    })}

                                                    <View style={styles.subSectionHeaderNew}>
                                                        <View style={styles.subSectionIconBoxNew}>
                                                             <MaterialIcons name="account-balance" size={16} color="#f97316" />
                                                        </View>
                                                        <Text style={styles.subSectionTitleNew}>BANK GUARANTEES ({wo.BankGuarantees?.length || 0})</Text>
                                                    </View>

                                                    {wo.BankGuarantees?.map((bg, bIdx) => (
                                                        <View key={bIdx} style={styles.bgCardNew}>
                                                             <View style={styles.bgCardMain}>
                                                                <View style={styles.bgInfoLeft}>
                                                                    <Text style={styles.bgBankNameNew}>{bg.BankName}</Text>
                                                                    <Text style={styles.bgNumberNew}>BG No: {bg.BGNumber}</Text>
                                                                </View>
                                                                <View style={styles.bgInfoRight}>
                                                                    <View style={styles.bgValueColumn}>
                                                                        <Text style={styles.bgValueLabelNew}>Amount</Text>
                                                                        <Text style={styles.bgValueTextNew}>₹{bg.Amount}</Text>
                                                                    </View>
                                                                    <TouchableOpacity 
                                                                        style={styles.btnBGIcon}
                                                                        onPress={() => {
                                                                            let url = bg.FileUrl || bg.DocumentUrl;
                                                                            if (url) {
                                                                                // Prepend base host if url is relative
                                                                                if (!url.startsWith('http')) {
                                                                                    const host = apiClient.getBaseHost();
                                                                                    url = host + (url.startsWith('/') ? url.slice(1) : url);
                                                                                }
                                                                                
                                                                                Linking.openURL(url).catch(err => {
                                                                                    console.error("Failed to open URL:", err);
                                                                                    Alert.alert('Error', 'Could not open document.');
                                                                                });
                                                                            } else {
                                                                                Alert.alert('Info', 'No document URL available.');
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Feather name="eye" size={18} color="#f97316" />
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity style={styles.btnBGIconUpload}>
                                                                        <Feather name="upload" size={18} color="#f97316" />
                                                                    </TouchableOpacity>
                                                                </View>
                                                             </View>
                                                             <View style={styles.bgDatesGrid}>
                                                                <View style={styles.bgDateItem}>
                                                                    <Text style={styles.bgDateLabel}>Issue Date</Text>
                                                                    <Text style={styles.bgDateText}>{formatDate(bg.IssueDate)}</Text>
                                                                </View>
                                                                <View style={styles.bgDateItem}>
                                                                    <Text style={styles.bgDateLabel}>Expiry Date</Text>
                                                                    <Text style={styles.bgDateText}>{formatDate(bg.ExpiryDate)}</Text>
                                                                </View>
                                                             </View>
                                                        </View>
                                                    ))}

                                                    <View style={styles.woBottomActionsRow}>
                                                        <TouchableOpacity 
                                                            style={styles.btnUploadBGMain}
                                                            onPress={() => handleUploadBG(wo)}
                                                        >
                                                             <Feather name="upload-cloud" size={16} color="#f97316" />
                                                             <Text style={styles.btnUploadBGMainText}>Upload BG</Text>
                                                        </TouchableOpacity>
                                                        <View style={styles.woFooterBtns}>
                                                            <TouchableOpacity 
                                                                style={styles.btnWOSecondary}
                                                                onPress={() => toggleWorkOrder(wo.Id)}
                                                            >
                                                                <Text style={styles.btnWOSecondaryText}>Cancel</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity style={styles.btnWOPrimary}>
                                                                <Text style={styles.btnWOPrimaryText}>Approve</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })
                            ) : (
                                <Text style={styles.emptyText}>No work orders found</Text>
                            )}
                        </View>
                    </View>

                    {/* Sidebar Column */}
                    <View style={styles.sidebarColumn}>
                        {/* Vendors List */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIconBoxRed}>
                                    <Feather name="users" size={16} color="#fff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>Vendors</Text>
                                </View>
                                <View style={styles.countBadge}><Text style={styles.countText}>{tender.Vendors?.length || 0}</Text></View>
                            </View>
                            {tender.Vendors?.map((vendor, index) => (
                                <View key={index} style={styles.vendorItem}>
                                    <View style={styles.vendorAvatar}>
                                        <Feather name="user" size={14} color="#dc2626" />
                                    </View>
                                    <View>
                                        <Text style={styles.vendorName}>{vendor.VendorName || 'N/A'}</Text>
                                        <Text style={styles.vendorEmail}>{vendor.VendorEmail}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Assets List */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIconBoxOrange}>
                                    <Feather name="box" size={16} color="#fff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>Assets</Text>
                                </View>
                                <View style={styles.countBadge}><Text style={styles.countText}>{tender.Assets?.length || 0}</Text></View>
                            </View>
                            {tender.Assets?.map((asset, index) => (
                                <View key={index} style={styles.assetItem}>
                                    <View style={styles.assetIconBox}>
                                        <Feather name="package" size={14} color="#f97316" />
                                    </View>
                                    <Text style={styles.assetName}>{asset.AssetName}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            <Modal
                visible={isFormModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsFormModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderIcon}>
                                <MaterialCommunityIcons name="view-grid-outline" size={24} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>{getModalHeader().title}</Text>
                                <Text style={styles.modalSubtitle}>{getModalHeader().subtitle}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsFormModalVisible(false)}>
                                <Feather name="x" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            {currentStep === 0 && (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 11, gap: 11 }}>
                                    <View style={styles.fieldContainer}>
                                        <View style={styles.fieldLabelRow}>
                                            <MaterialCommunityIcons name="file-document-outline" size={14} color="#6b7280" />
                                            <Text style={styles.fieldLabel}> PROJECT</Text>
                                        </View>
                                        <View style={styles.fieldValueBox}>
                                            <View style={styles.fieldIconBox}>
                                                <Feather name="briefcase" size={16} color="#4b5563" />
                                            </View>
                                            <Text style={styles.fieldValueText}>{tender.ProjectName}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.fieldContainer}>
                                        <View style={styles.fieldLabelRow}>
                                            <MaterialCommunityIcons name="file-document-outline" size={14} color="#6b7280" />
                                            <Text style={styles.fieldLabel}> WORK ORDER</Text>
                                        </View>
                                        <View style={styles.fieldValueBox}>
                                            <View style={styles.fieldIconBox}>
                                                <Feather name="briefcase" size={16} color="#4b5563" />
                                            </View>
                                            <Text style={styles.fieldValueText}>{selectedWorkOrder?.WONumber}</Text>
                                        </View>
                                    </View>
                                    {renderDropdownField('ASSET', 'assetId', tender.Assets?.map(a => ({ Id: a.AssetId || a.Id, Name: a.AssetName })) || [], <Feather name="box" size={14} />, true, true)}

                                    {(() => {
                                        const selectedAsset = tender.Assets?.find(a => String(a.AssetId || a.Id) === String(formData.assetId));
                                        const asType = selectedAsset?.AssetType?.[0];
                                        const subType = asType?.AssetSubType?.[0];
                                        const typeName = asType?.Name || 'N/A';
                                        const subTypeName = subType?.Name || 'N/A';

                                        return (
                                            <>
                                                <View style={styles.fieldContainer}>
                                                    <View style={styles.fieldLabelRow}>
                                                        <Feather name="layers" size={14} color="#6b7280" />
                                                        <Text style={styles.fieldLabel}> ASSET TYPE</Text>
                                                    </View>
                                                    <View style={[styles.fieldValueBox, { backgroundColor: '#f3f4f6' }]}>
                                                        <View style={styles.fieldIconBox}>
                                                            <Feather name="check" size={16} color="#9ca3af" />
                                                        </View>
                                                        <Text style={[styles.fieldValueText, { color: '#9ca3af' }]}>{typeName}</Text>
                                                    </View>
                                                </View>

                                                <View style={styles.fieldContainer}>
                                                    <View style={styles.fieldLabelRow}>
                                                        <Feather name="list" size={14} color="#6b7280" />
                                                        <Text style={styles.fieldLabel}> ASSET SUBTYPE</Text>
                                                    </View>
                                                    <View style={[styles.fieldValueBox, { backgroundColor: '#f3f4f6' }]}>
                                                        <View style={styles.fieldIconBox}>
                                                            <Feather name="check" size={16} color="#9ca3af" />
                                                        </View>
                                                        <Text style={[styles.fieldValueText, { color: '#9ca3af' }]}>{subTypeName}</Text>
                                                    </View>
                                                </View>
                                            </>
                                        );
                                    })()}
                                </ScrollView>
                            )}

                            {currentStep === 1 && (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 11, gap: 11 }}>
                                    <View style={styles.sectionDivider}>
                                        <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>A</Text></View>
                                        <Text style={styles.sectionLabel}>Beneficiary Information</Text>
                                    </View>
                                    <View style={styles.formGrid}>
                                        {renderFormField('Full Name', 'fullName', <Feather name="user" size={14} />, 'Tatwaswe Dev', true)}
                                        {renderFormField('Father/Spouse Name', 'fatherName', <Feather name="user" size={14} />, 'Tatwaswe Dev')}
                                        {renderFormField('Phone Number', 'phoneNumber', <Feather name="phone" size={14} />, '6787877777', true)}
                                        {renderFormField('Alt. Phone Number', 'altPhoneNumber', <Feather name="phone" size={14} />, 'Alt. Phone Number')}
                                        {renderFormField('Email', 'email', <Feather name="mail" size={14} />, 'dessv.tatwatech@gmail.com')}
                                        {renderDropdownField('Gender', 'gender', [{ Id: 1, Name: 'Male' }, { Id: 2, Name: 'Female' }], null)}
                                        {renderDropdownField('SES', 'ses', [{ Id: 1, Name: 'APL' }, { Id: 2, Name: 'BPL' }], null)}
                                        {renderDropdownField('Caste', 'caste', [{ Id: 1, Name: 'General' }, { Id: 2, Name: 'OBC' }], null)}
                                    </View>

                                    <View style={styles.photoUploadContainer}>
                                        <Text style={styles.formLabel}><Feather name="camera" size={14} /> Beneficiary Photo</Text>
                                        <TouchableOpacity
                                            style={styles.photoUploadBox}
                                            onPress={() => handleAddFileChoice((asset) => updateFormData('beneficiaryPhoto', asset.uri))}
                                        >
                                            <View style={styles.photoUploadIcon}>
                                                <Feather name="camera" size={24} color="#9ca3af" />
                                            </View>
                                            <Text style={styles.photoUploadText}>
                                                {formData.beneficiaryPhoto ? 'Photo Captured' : 'Click to upload'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            )}

                            {currentStep === 2 && (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 11, gap: 11 }}>
                                    <View style={styles.sectionDivider}>
                                        <View style={[styles.sectionBadge, { backgroundColor: '#ffedd5' }]}><Text style={[styles.sectionBadgeText, { color: '#f97316' }]}>B</Text></View>
                                        <Text style={[styles.sectionLabel, { color: '#f97316' }]}>Location Information</Text>
                                    </View>
                                    <View style={styles.formGrid}>
                                        {renderDropdownField('State', 'stateId', [{ Id: 1, Name: 'Odisha' }], null, true)}
                                        {renderDropdownField('District', 'districtId', districts, null, true)}
                                        {renderDropdownField('Block', 'blockId', blocks, null, true)}
                                        {renderDropdownField('Gram Panchayat', 'gpId', gps, null)}
                                        {renderDropdownField('Village', 'villageId', villages, null)}
                                        {renderFormField('Pin Code', 'pinCode', null, '787878')}
                                        {renderFormField('House No', 'houseNo', null, 'House Number')}
                                        {renderFormField('Area/Locality', 'areaLocality', null, 'Area or Locality')}
                                        {renderFormField('Street/Landmark', 'streetLandmark', null, 'Street or Landmark')}
                                    </View>
                                </ScrollView>
                            )}

                            {currentStep === 3 && (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 11, gap: 11 }}>
                                    <View style={styles.sectionDivider}>
                                        <View style={[styles.sectionBadge, { backgroundColor: '#f3e8ff' }]}><Text style={[styles.sectionBadgeText, { color: '#9333ea' }]}>3</Text></View>
                                        <Text style={[styles.sectionLabel, { color: '#9333ea' }]}>Asset Technical Details</Text>
                                    </View>
                                    <View style={styles.formGrid}>
                                        {renderFormField('Capacity', 'capacity', <Feather name="zap" size={14} />, '56')}
                                        {renderDropdownField('CMC Period (Years)', 'cmcPeriod', [{ Id: 1, Name: '1 Year' }, { Id: 4, Name: '4 Years' }], null)}
                                        {renderFormField('Installation Class', 'installationClass', <Feather name="box" size={14} />, 'Ground Mounted Solar...')}
                                        {renderFormField('Date of Installation', 'dateOfInstallation', <Feather name="calendar" size={14} />, '03/11/2026', true)}
                                        {renderFormField('Date of Commissioning', 'dateOfCommissioning', <Feather name="calendar" size={14} />, '03/17/2026', true)}
                                    </View>
                                </ScrollView>
                            )}

                            {currentStep === 4 && (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 11, gap: 11 }}>
                                    <View style={styles.sectionDivider}>
                                        <View style={[styles.sectionBadge, { backgroundColor: '#dbeafe' }]}><Text style={[styles.sectionBadgeText, { color: '#3b82f6' }]}>4</Text></View>
                                        <Text style={[styles.sectionLabel, { color: '#3b82f6' }]}>Installation Location</Text>
                                    </View>
                                    <View style={styles.formGrid}>
                                        {renderDropdownField('State', 'stateId', [{ Id: 1, Name: 'Odisha' }], null, true)}
                                        {renderDropdownField('District', 'districtId', districts, null, true)}
                                        {renderDropdownField('Block', 'blockId', blocks, null, true)}
                                        {renderDropdownField('Gram Panchayat', 'gpId', gps, null)}
                                        {renderDropdownField('Village', 'villageId', villages, null)}
                                        {renderDropdownField('Habitation', 'habitation', [], null)}
                                        {renderFormField('Pin Code', 'pinCode', null, '787878')}
                                        {renderFormField('House No', 'houseNo', null, 'House Number')}
                                        {renderFormField('Area/Locality', 'areaLocality', null, 'Area or Locality')}
                                        {renderFormField('Street/Landmark', 'streetLandmark', null, 'Street or Landmark')}

                                        <View style={[styles.formField, { width: '100%' }]}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.btnUploadBG,
                                                    { borderColor: '#3b82f6', backgroundColor: '#eff6ff', width: '100%', justifyContent: 'center' },
                                                    isCapturingLocation && { opacity: 0.7 }
                                                ]}
                                                onPress={handleGetCurrentLocation}
                                                disabled={isCapturingLocation}
                                            >
                                                {isCapturingLocation ? (
                                                    <ActivityIndicator size="small" color="#3b82f6" />
                                                ) : (
                                                    <Feather name="map-pin" size={16} color="#3b82f6" />
                                                )}
                                                <Text style={[styles.btnUploadBGText, { color: '#3b82f6' }]}>
                                                    {isCapturingLocation ? 'Capturing...' : 'Capture Current Location'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        {renderFormField('Latitude', 'latitude', <Feather name="map-pin" size={14} />, '40.6892')}
                                        {renderFormField('Longitude', 'longitude', <Feather name="map-pin" size={14} />, '40.6892')}
                                    </View>
                                </ScrollView>
                            )}

                            {currentStep === 5 && (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 11, gap: 11 }}>
                                    <View style={styles.sectionDivider}>
                                        <View style={[styles.sectionBadge, { backgroundColor: '#fef3c7' }]}><Text style={[styles.sectionBadgeText, { color: '#d97706' }]}>5</Text></View>
                                        <Text style={[styles.sectionLabel, { color: '#d97706' }]}>Documents Upload</Text>
                                    </View>
                                    <View style={styles.formGrid}>
                                        <View style={styles.formField}>
                                            <Text style={styles.formLabel}>Installation Photo</Text>
                                            {formData.installationPhoto ? (
                                                <Image source={{ uri: formData.installationPhoto }} style={{ width: 85, height: 85, borderRadius: 8, marginBottom: 5 }} />
                                            ) : (
                                                <View style={[styles.photoUploadBox, { marginTop: 0 }]}>
                                                    <Feather name="image" size={24} color="#9ca3af" />
                                                </View>
                                            )}
                                            <TouchableOpacity
                                                style={[styles.btnUploadBG, { marginTop: 5 }]}
                                                onPress={() => handleAddFileChoice((asset) => updateFormData('installationPhoto', asset.uri))}
                                            >
                                                <Feather name="upload-cloud" size={16} color="#f97316" />
                                                <Text style={styles.btnUploadBGText}>{formData.installationPhoto ? 'Photo Selected' : 'Upload Photo'}</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.formField}>
                                            <Text style={styles.formLabel}>Installation Certificate</Text>
                                            <TouchableOpacity
                                                style={styles.btnUploadBG}
                                                onPress={() => handleAddFileChoice((asset) => updateFormData('installationCertificate', asset.uri), true)}
                                            >
                                                <Feather name="upload-cloud" size={16} color="#f97316" />
                                                <Text style={styles.btnUploadBGText}>{formData.installationCertificate ? 'File Selected' : 'Upload CC'}</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.formField}>
                                            <Text style={styles.formLabel}>JCC Document</Text>
                                            <TouchableOpacity
                                                style={styles.btnUploadBG}
                                                onPress={() => handleAddFileChoice((asset) => updateFormData('jccDocument', asset.uri), true)}
                                            >
                                                <Feather name="upload-cloud" size={16} color="#f97316" />
                                                <Text style={styles.btnUploadBGText}>{formData.jccDocument ? 'File Selected' : 'Upload JCC'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </ScrollView>
                            )}

                            {currentStep === 6 && (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 11, gap: 11 }}>
                                    <View style={styles.sectionDivider}>
                                        <View style={[styles.sectionBadge, { backgroundColor: '#f3e8ff' }]}><Text style={[styles.sectionBadgeText, { color: '#9333ea' }]}>6</Text></View>
                                        <Text style={[styles.sectionLabel, { color: '#9333ea' }]}>Component Asset Details</Text>
                                    </View>
                                    <View style={{ paddingBottom: 14 }}>
                                        <Text style={[styles.placeholderSubtitle, { marginBottom: 11 }]}>Add technical specifications for each component category</Text>

                                        {formData.componentValues.length > 0 ? (
                                            formData.componentValues.map((comp, idx) => (
                                                <View key={idx} style={styles.fieldValueBox}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ fontSize: 11, fontWeight: 'bold' }}>Category ID: {comp.CategoryId}</Text>
                                                        <Text style={{ fontSize: 10, color: '#666' }}>Header ID: {comp.HeaderId} | Row: {comp.RowIndex}</Text>
                                                        <Text style={{ fontSize: 11, marginTop: 2 }}>Value: {comp.ValueText}</Text>
                                                    </View>
                                                </View>
                                            ))
                                        ) : (
                                            <View style={styles.emptyPlaceholderCard}>
                                                <MaterialIcons name="list-alt" size={24} color="#9ca3af" />
                                                <Text style={styles.placeholderSubtitle}>No component details added yet.</Text>
                                            </View>
                                        )}
                                    </View>
                                </ScrollView>
                            )}
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.btnBackArrow}
                                onPress={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                                disabled={currentStep === 0}
                            >
                                <Feather name="arrow-left" size={20} color={currentStep === 0 ? "#d1d5db" : "#fff"} />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }} />
                            <TouchableOpacity
                                style={styles.btnCancel}
                                onPress={() => setIsFormModalVisible(false)}
                            >
                                <Text style={styles.btnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSaveNext} onPress={handleNextStep}>
                                <Text style={styles.btnSaveNextText}>{currentStep === 6 ? 'Submit Form' : 'Save & Next'}</Text>
                                <Feather name={currentStep === 6 ? "check" : "chevron-right"} size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Raw Material Upload Modal */}
            <Modal
                visible={isMaterialModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsMaterialModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderIcon}>
                                <Feather name="package" size={24} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.modalTitle}>Upload Raw Material</Text>
                                <Text style={styles.modalSubtitle}>Work Order: {selectedWorkOrder?.WONumber}</Text>
                            </View>
                        </View>

                        <View style={styles.modalBody}>
                            <ScrollView style={{ maxHeight: 425 }} showsVerticalScrollIndicator={false}>
                                <View style={styles.materialForm}>
                                    {(() => {
                                        const asset = selectedWorkOrder?.Assets?.find(a => (a.AssetId || a.Id) === materialAssetId);
                                        const asType = asset?.AssetType?.[0];
                                        const subType = asType?.AssetSubType?.[0];

                                        const assetName = asset?.AssetName || 'No asset selected';
                                        const typeName = asType?.Name || 'N/A';
                                        const subTypeName = subType?.Name || 'N/A';

                                        return (
                                            <>
                                                <View style={styles.fieldContainer}>
                                                    <View style={styles.fieldLabelRow}>
                                                        <Text style={styles.fieldLabel}>SELECTED ASSET</Text>
                                                    </View>
                                                    <View style={styles.fieldValueBox}>
                                                        <View style={styles.fieldIconBox}>
                                                            <Feather name="cpu" size={16} color="#3b82f6" />
                                                        </View>
                                                        <Text style={styles.fieldValueText}>{assetName}</Text>
                                                    </View>
                                                </View>

                                                <View style={styles.fieldContainer}>
                                                    <View style={styles.fieldLabelRow}>
                                                        <Text style={styles.fieldLabel}>ASSET TYPE</Text>
                                                    </View>
                                                    <View style={[styles.fieldValueBox, { backgroundColor: '#f3f4f6' }]}>
                                                        <View style={styles.fieldIconBox}>
                                                            <Feather name="layers" size={16} color="#9ca3af" />
                                                        </View>
                                                        <Text style={[styles.fieldValueText, { color: '#9ca3af' }]}>{typeName}</Text>
                                                    </View>
                                                </View>

                                                <View style={styles.fieldContainer}>
                                                    <View style={styles.fieldLabelRow}>
                                                        <Text style={styles.fieldLabel}>ASSET SUBTYPE</Text>
                                                    </View>
                                                    <View style={[styles.fieldValueBox, { backgroundColor: '#f3f4f6' }]}>
                                                        <View style={styles.fieldIconBox}>
                                                            <Feather name="list" size={16} color="#9ca3af" />
                                                        </View>
                                                        <Text style={[styles.fieldValueText, { color: '#9ca3af' }]}>{subTypeName}</Text>
                                                    </View>
                                                </View>
                                            </>
                                        );
                                    })()}

                                    <View style={styles.fieldContainer}>
                                        <View style={styles.fieldLabelRow}>
                                            <Text style={styles.fieldLabel}>UPLOAD MATERIAL FILES</Text>
                                        </View>
                                        <TouchableOpacity style={styles.btnPickFiles} onPress={pickMaterialFiles}>
                                            <Feather name="plus-circle" size={20} color="#6b7280" />
                                            <Text style={styles.btnPickFilesText}>Add Photos or Documents</Text>
                                        </TouchableOpacity>

                                        <View style={styles.fileList}>
                                            {materialFiles.map((file, index) => (
                                                <View key={index} style={styles.fileItem}>
                                                    {file.mimeType?.startsWith('image/') ? (
                                                        <Image source={{ uri: file.uri }} style={styles.filePreview} />
                                                    ) : (
                                                        <View style={styles.fileIconBox}>
                                                            <Feather name="file-text" size={16} color="#6b7280" />
                                                        </View>
                                                    )}
                                                    <View style={{ flex: 1, marginLeft: 5 }}>
                                                        <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                                                        <Text style={styles.fileStatus}>Ready to upload</Text>
                                                    </View>
                                                    <TouchableOpacity onPress={() => removeMaterialFile(index)} style={styles.removeFileBtn}>
                                                        <Feather name="trash-2" size={16} color="#dc2626" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.btnCancel}
                                onPress={() => setIsMaterialModalVisible(false)}
                            >
                                <Text style={styles.btnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btnSaveNext, { backgroundColor: '#10b981' }]}
                                onPress={handleMaterialUpload}
                                disabled={isUploadingMaterial}
                            >
                                {isUploadingMaterial ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.btnSaveNextText}>Upload Material</Text>
                                        <Feather name="upload" size={16} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Bank Guarantee Upload Modal */}
            <Modal
                visible={isBGModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsBGModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderIcon}>
                                <Feather name="shield" size={24} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.modalTitle}>Upload Bank Guarantee</Text>
                                <Text style={styles.modalSubtitle}>Work Order: {selectedWorkOrder?.WONumber}</Text>
                            </View>
                        </View>

                        <View style={styles.modalBody}>
                            <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.7 }} showsVerticalScrollIndicator={false}>
                                <View style={styles.materialForm}>

                                    <View style={styles.sectionDivider}>
                                        <Text style={styles.sectionLabel}>Guarantee Details</Text>
                                    </View>

                                    {/* Bank Name Field */}
                                    <View style={styles.formField}>
                                        <Text style={styles.formLabel}>Bank Name <Text style={{ color: '#dc2626' }}>*</Text></Text>
                                        <View style={styles.inputWrapper}>
                                            <View style={styles.inputIcon}><MaterialCommunityIcons name="bank-outline" size={14} color="#6b7280" /></View>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter Bank Name"
                                                value={bgFormData.bankName}
                                                onChangeText={(text) => updateBgFormData('bankName', text)}
                                            />
                                        </View>
                                    </View>

                                    {/* BG Number Field */}
                                    <View style={styles.formField}>
                                        <Text style={styles.formLabel}>BG Number <Text style={{ color: '#dc2626' }}>*</Text></Text>
                                        <View style={styles.inputWrapper}>
                                            <View style={styles.inputIcon}><Feather name="hash" size={14} color="#6b7280" /></View>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter BG Number"
                                                value={bgFormData.bgNumber}
                                                onChangeText={(text) => updateBgFormData('bgNumber', text)}
                                            />
                                        </View>
                                    </View>

                                    {/* Amount Field */}
                                    <View style={styles.formField}>
                                        <Text style={styles.formLabel}>Amount <Text style={{ color: '#dc2626' }}>*</Text></Text>
                                        <View style={styles.inputWrapper}>
                                            <View style={styles.inputIcon}><MaterialCommunityIcons name="currency-inr" size={16} color="#6b7280" /></View>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter Amount"
                                                keyboardType="numeric"
                                                value={bgFormData.amount}
                                                onChangeText={(text) => updateBgFormData('amount', text)}
                                            />
                                        </View>
                                    </View>

                                    {/* Dates Row */}
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <View style={[styles.formField, { flex: 1 }]}>
                                            <Text style={styles.formLabel}>
                                                Issue Date <Text style={{ color: '#dc2626' }}>*</Text>
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.inputWrapper}
                                                onPress={() => {
                                                    setDatePickerTarget('issueDate');
                                                    setShowDatePicker(true);
                                                }}
                                            >
                                                <View style={styles.inputIcon}><Feather name="calendar" size={14} color="#6b7280" /></View>
                                                <Text style={[styles.input, { textAlignVertical: 'center', paddingTop: 8, color: bgFormData.issueDate ? '#1e293b' : '#9ca3af' }]}>
                                                    {bgFormData.issueDate || 'DD/MM/YYYY'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={[styles.formField, { flex: 1 }]}>
                                            <Text style={styles.formLabel}>
                                                Expiry Date <Text style={{ color: '#dc2626' }}>*</Text>
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.inputWrapper}
                                                onPress={() => {
                                                    setDatePickerTarget('expiryDate');
                                                    setShowDatePicker(true);
                                                }}
                                            >
                                                <View style={styles.inputIcon}><Feather name="calendar" size={14} color="#6b7280" /></View>
                                                <Text style={[styles.input, { textAlignVertical: 'center', paddingTop: 8, color: bgFormData.expiryDate ? '#1e293b' : '#9ca3af' }]}>
                                                    {bgFormData.expiryDate || 'DD/MM/YYYY'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={(() => {
                                                if (datePickerTarget && bgFormData[datePickerTarget]) {
                                                    const [d, m, y] = bgFormData[datePickerTarget].split('/').map(Number);
                                                    return new Date(y, m - 1, d);
                                                }
                                                return new Date();
                                            })()}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={onBgDateChange}
                                        />
                                    )}

                                    {/* BG Document Upload */}
                                    <View style={styles.formField}>
                                        <Text style={styles.formLabel}>BG Document <Text style={{ color: '#dc2626' }}>*</Text></Text>
                                        <TouchableOpacity
                                            style={[styles.btnUploadBG, { marginTop: 2, width: '100%', justifyContent: 'center' }]}
                                            onPress={handleAddBGDocument}
                                        >
                                            <Feather name="upload" size={16} color="#4b5563" />
                                            <Text style={[styles.btnUploadBGText, { color: '#4b5563' }]}>Choose File</Text>
                                        </TouchableOpacity>
                                        {bgFormData.document && (
                                            <View style={styles.fileItemBg}>
                                                <Feather name="file-text" size={14} color="#059669" />
                                                <Text style={styles.fileNameBg} numberOfLines={1}>{bgFormData.document.name}</Text>
                                            </View>
                                        )}
                                    </View>

                                </View>
                            </ScrollView>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.btnCancel}
                                onPress={() => setIsBGModalVisible(false)}
                            >
                                <Text style={styles.btnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btnSaveNext, { backgroundColor: '#10b981' }]}
                                onPress={handleSubmitBGs}
                                disabled={isSubmittingBGs}
                            >
                                {isSubmittingBGs ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.btnSaveNextText}>Submit Guarantee</Text>
                                        <Feather name="check" size={16} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* File Source Selection Modal */}
            <Modal
                visible={isFileSourceVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsFileSourceVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.selectionContentWide}>
                        <View style={styles.selectionHeader}>
                            <Text style={styles.selectionTitle}>Select File Source</Text>
                            <TouchableOpacity onPress={() => setIsFileSourceVisible(false)}>
                                <Feather name="x" size={20} color="#4b5563" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.sourceGrid}>
                            <TouchableOpacity
                                style={styles.sourceItem}
                                onPress={() => {
                                    setIsFileSourceVisible(false);
                                    handleTakePhoto(onFileSourceSelected);
                                }}
                            >
                                <View style={[styles.sourceIconBox, { backgroundColor: '#fee2e2' }]}>
                                    <Feather name="camera" size={24} color="#dc2626" />
                                </View>
                                <Text style={styles.sourceText}>Camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.sourceItem}
                                onPress={() => {
                                    setIsFileSourceVisible(false);
                                    handlePickFromGallery(onFileSourceSelected);
                                }}
                            >
                                <View style={[styles.sourceIconBox, { backgroundColor: '#dbeafe' }]}>
                                    <Feather name="image" size={24} color="#3b82f6" />
                                </View>
                                <Text style={styles.sourceText}>Gallery</Text>
                            </TouchableOpacity>

                            {allowSourceDocuments && (
                                <TouchableOpacity
                                    style={styles.sourceItem}
                                    onPress={async () => {
                                        setIsFileSourceVisible(false);
                                        try {
                                            const result = await DocumentPicker.getDocumentAsync({
                                                type: ['application/pdf', 'image/*'],
                                                copyToCacheDirectory: true,
                                            });
                                            if (!result.canceled) {
                                                onFileSourceSelected(result.assets[0]);
                                            }
                                        } catch (err) {
                                            console.error('Error picking document:', err);
                                            Alert.alert('Error', 'Failed to pick document');
                                        }
                                    }}
                                >
                                    <View style={[styles.sourceIconBox, { backgroundColor: '#dcfce7' }]}>
                                        <Feather name="file-text" size={24} color="#16a34a" />
                                    </View>
                                    <Text style={styles.sourceText}>Document</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.sourceCancelBtn}
                            onPress={() => setIsFileSourceVisible(false)}
                        >
                            <Text style={styles.sourceCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Selection Modal for Dropdowns */}
            <Modal
                visible={isSelectionModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsSelectionModalVisible(false)}
            >
                <View style={styles.selectionOverlay}>
                    <View style={styles.selectionContent}>
                        <View style={styles.selectionHeader}>
                            <Text style={styles.selectionTitle}>{selectionTitle}</Text>
                            <TouchableOpacity onPress={() => setIsSelectionModalVisible(false)}>
                                <Feather name="x" size={20} color="#4b5563" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.selectionScroll} showsVerticalScrollIndicator={false}>
                            {selectionData.map((item) => (
                                <TouchableOpacity
                                    key={item.Id}
                                    style={styles.selectionItem}
                                    onPress={() => {
                                        updateFormData(selectionKey, item.Id);
                                        setIsSelectionModalVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.selectionText,
                                        (formData as any)[selectionKey] === item.Id && styles.selectionTextSelected
                                    ]}>
                                        {item.Name}
                                    </Text>
                                    {(formData as any)[selectionKey] === item.Id && (
                                        <Feather name="check" size={16} color="#c1272d" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};





export default TenderDetailsScreen;
