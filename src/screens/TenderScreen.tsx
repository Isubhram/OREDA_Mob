import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const TenderScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Tender Screen</Text>
                <Text style={styles.subtitle}>Explore and track available tenders.</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
});

export default TenderScreen;
