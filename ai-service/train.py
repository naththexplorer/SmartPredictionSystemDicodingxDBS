def display(x): print(x)
def display(x): print(x)
import json
import random
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)

DATA_PATH = Path('dataset_final_modelling_clean.csv')
MODEL_DIR = Path('models')
MODEL_DIR.mkdir(exist_ok=True)

HIGH_ALERT_THRESHOLD = 0.35
DEFAULT_PREDICTION_THRESHOLD = 0.50
EPOCHS = 15
BATCH_SIZE = 64
LEARNING_RATE = 1e-3

NUMERICAL_FEATURES = [
    'curah_hujan_mm',
    'suhu_rata2_c',
    'suhu_max_c',
    'suhu_min_c',
    'kelembaban_persen',
    'hujan_akumulasi_7d_mm',
    'hari_kering_berturut',
    'month',
    'quarter',
    'freq_bencana',
]

CATEGORICAL_FEATURES = ['province', 'city']
TARGET = 'risk_score'
ALERT_TARGET = 'risk_alert'
ALERT_LABEL = 'risk_alert_label'
ALERT_LABELS = ['Normal Risk', 'High Alert']

MODEL_PATH = MODEL_DIR / 'disaster_risk_high_alert_model.keras'
METADATA_PATH = MODEL_DIR / 'disaster_risk_high_alert_metadata.json'
df = pd.read_csv(DATA_PATH)

required_columns = NUMERICAL_FEATURES + CATEGORICAL_FEATURES + [TARGET]
missing_columns = [column for column in required_columns if column not in df.columns]
if missing_columns:
    raise ValueError(f'Kolom wajib tidak ditemukan: {missing_columns}')

for column in NUMERICAL_FEATURES + [TARGET]:
    df[column] = pd.to_numeric(df[column], errors='coerce')

for column in CATEGORICAL_FEATURES:
    df[column] = df[column].astype(str).str.strip().str.upper()

df['month'] = df['month'].astype('int32')
df['quarter'] = ((df['month'] - 1) // 3 + 1).astype('int32')

validation_errors = {}
if df[required_columns].isna().sum().sum() > 0:
    validation_errors['missing_values'] = df[required_columns].isna().sum().to_dict()
if not df[TARGET].between(0, 1).all():
    validation_errors['risk_score_range'] = 'risk_score harus berada di rentang 0 sampai 1'
if not df['month'].between(1, 12).all():
    validation_errors['month_range'] = 'month harus berada di rentang 1 sampai 12'
if not df['quarter'].between(1, 4).all():
    validation_errors['quarter_range'] = 'quarter harus berada di rentang 1 sampai 4'

if validation_errors:
    raise ValueError(validation_errors)

print(f'Dataset shape: {df.shape}')
display(df.head())
def add_alert_target(dataframe):
    result = dataframe.copy()
    result[ALERT_TARGET] = (result[TARGET] > HIGH_ALERT_THRESHOLD).astype('int32')
    result[ALERT_LABEL] = np.where(result[ALERT_TARGET].eq(1), 'High Alert', 'Normal Risk')
    return result


df = add_alert_target(df)

target_distribution = (
    df[ALERT_LABEL]
    .value_counts()
    .rename_axis('risk_level')
    .reset_index(name='count')
)
target_distribution['percentage'] = (target_distribution['count'] / len(df) * 100).round(2)

majority_baseline_accuracy = df[ALERT_TARGET].value_counts(normalize=True).max()

print(f'High Alert threshold: risk_score > {HIGH_ALERT_THRESHOLD}')
print(f'Majority baseline accuracy: {majority_baseline_accuracy:.4f}')
display(target_distribution)
def stratified_split(dataframe, stratify_column, train_size=0.70, val_size=0.15, seed=SEED):
    rng = np.random.default_rng(seed)
    train_parts = []
    val_parts = []
    test_parts = []

    for _, group in dataframe.groupby(stratify_column, sort=False):
        indices = group.index.to_numpy().copy()
        rng.shuffle(indices)
        n_rows = len(indices)
        n_train = int(np.floor(n_rows * train_size))
        n_val = int(np.floor(n_rows * val_size))

        train_parts.append(dataframe.loc[indices[:n_train]])
        val_parts.append(dataframe.loc[indices[n_train:n_train + n_val]])
        test_parts.append(dataframe.loc[indices[n_train + n_val:]])

    train_data = pd.concat(train_parts).sample(frac=1, random_state=seed).reset_index(drop=True)
    val_data = pd.concat(val_parts).sample(frac=1, random_state=seed).reset_index(drop=True)
    test_data = pd.concat(test_parts).sample(frac=1, random_state=seed).reset_index(drop=True)
    return train_data, val_data, test_data


train_df, val_df, test_df = stratified_split(df, ALERT_LABEL)

split_summary = pd.DataFrame({
    'split': ['train', 'validation', 'test'],
    'rows': [len(train_df), len(val_df), len(test_df)],
    'normal_risk': [int((train_df[ALERT_TARGET] == 0).sum()), int((val_df[ALERT_TARGET] == 0).sum()), int((test_df[ALERT_TARGET] == 0).sum())],
    'high_alert': [int((train_df[ALERT_TARGET] == 1).sum()), int((val_df[ALERT_TARGET] == 1).sum()), int((test_df[ALERT_TARGET] == 1).sum())],
})
split_summary['high_alert_percentage'] = (split_summary['high_alert'] / split_summary['rows'] * 100).round(2)
display(split_summary)
normalizer = layers.Normalization(axis=-1, name='numeric_normalization')
normalizer.adapt(train_df[NUMERICAL_FEATURES].astype('float32').to_numpy())

province_lookup = layers.StringLookup(output_mode='int', name='province_lookup')
city_lookup = layers.StringLookup(output_mode='int', name='city_lookup')

province_lookup.adapt(train_df['province'].astype(str).to_numpy())
city_lookup.adapt(train_df['city'].astype(str).to_numpy())

preprocessing_summary = pd.DataFrame({
    'component': ['normalizer', 'province_lookup', 'city_lookup'],
    'detail': [
        f'{len(NUMERICAL_FEATURES)} numerical features',
        f'{province_lookup.vocabulary_size()} tokens',
        f'{city_lookup.vocabulary_size()} tokens',
    ],
})
display(preprocessing_summary)
def embedding_dim(vocab_size, max_dim):
    return int(min(max_dim, max(2, round(np.sqrt(vocab_size)))))


def build_high_alert_model():
    numeric_input = keras.Input(shape=(len(NUMERICAL_FEATURES),), name='numeric_features', dtype=tf.float32)
    province_input = keras.Input(shape=(1,), name='province', dtype=tf.string)
    city_input = keras.Input(shape=(1,), name='city', dtype=tf.string)

    numeric_encoded = normalizer(numeric_input)
    province_ids = province_lookup(province_input)
    city_ids = city_lookup(city_input)

    province_encoded = layers.Embedding(
        input_dim=province_lookup.vocabulary_size(),
        output_dim=embedding_dim(province_lookup.vocabulary_size(), 12),
        name='province_embedding',
    )(province_ids)
    province_encoded = layers.Flatten(name='province_flatten')(province_encoded)

    city_encoded = layers.Embedding(
        input_dim=city_lookup.vocabulary_size(),
        output_dim=embedding_dim(city_lookup.vocabulary_size(), 32),
        name='city_embedding',
    )(city_ids)
    city_encoded = layers.Flatten(name='city_flatten')(city_encoded)

    x = layers.Concatenate(name='feature_concatenate')([numeric_encoded, province_encoded, city_encoded])
    x = layers.Dense(128, activation='relu', name='dense_128')(x)
    x = layers.Dropout(0.20, name='dropout_1')(x)
    x = layers.Dense(64, activation='relu', name='dense_64')(x)
    x = layers.Dropout(0.15, name='dropout_2')(x)
    x = layers.Dense(32, activation='relu', name='dense_32')(x)
    output = layers.Dense(1, activation='sigmoid', name='high_alert_probability')(x)

    return keras.Model(
        inputs={'numeric_features': numeric_input, 'province': province_input, 'city': city_input},
        outputs=output,
        name='disaster_risk_high_alert_model',
    )


model = build_high_alert_model()
model.summary()
def custom_binary_crossentropy_loss(y_true, y_pred):
    epsilon = tf.keras.backend.epsilon()
    y_true = tf.cast(tf.reshape(y_true, [-1]), tf.float32)
    y_pred = tf.cast(tf.reshape(y_pred, [-1]), tf.float32)
    y_pred = tf.clip_by_value(y_pred, epsilon, 1.0 - epsilon)
    loss = -(y_true * tf.math.log(y_pred) + (1.0 - y_true) * tf.math.log(1.0 - y_pred))
    return tf.reduce_mean(loss)
def make_dataset(dataframe, shuffle=False, batch_size=BATCH_SIZE):
    inputs = {
        'numeric_features': dataframe[NUMERICAL_FEATURES].astype('float32').to_numpy(),
        'province': dataframe['province'].astype(str).to_numpy(),
        'city': dataframe['city'].astype(str).to_numpy(),
    }
    target = dataframe[ALERT_TARGET].astype('float32').to_numpy().reshape(-1, 1)
    dataset = tf.data.Dataset.from_tensor_slices((inputs, target))
    if shuffle:
        dataset = dataset.shuffle(buffer_size=len(dataframe), seed=SEED, reshuffle_each_iteration=True)
    return dataset.batch(batch_size).prefetch(tf.data.AUTOTUNE)


train_ds = make_dataset(train_df, shuffle=True)
val_ds = make_dataset(val_df)
test_ds = make_dataset(test_df)
def binary_metrics_from_arrays(y_true, y_prob, threshold=DEFAULT_PREDICTION_THRESHOLD):
    y_true = np.asarray(y_true).astype(int).reshape(-1)
    y_prob = np.asarray(y_prob).reshape(-1)
    y_pred = (y_prob >= threshold).astype(int)

    tn = int(((y_true == 0) & (y_pred == 0)).sum())
    fp = int(((y_true == 0) & (y_pred == 1)).sum())
    fn = int(((y_true == 1) & (y_pred == 0)).sum())
    tp = int(((y_true == 1) & (y_pred == 1)).sum())
    total = max(tn + fp + fn + tp, 1)

    accuracy = (tp + tn) / total
    precision = tp / max(tp + fp, 1)
    recall = tp / max(tp + fn, 1)
    f1 = 2 * precision * recall / max(precision + recall, 1e-12)

    return {
        'threshold': float(threshold),
        'accuracy': float(accuracy),
        'precision_high_alert': float(precision),
        'recall_high_alert': float(recall),
        'f1_high_alert': float(f1),
        'confusion_matrix': [[tn, fp], [fn, tp]],
        'support_normal_risk': int((y_true == 0).sum()),
        'support_high_alert': int((y_true == 1).sum()),
    }


def confusion_matrix_dataframe(metrics):
    matrix = metrics['confusion_matrix']
    return pd.DataFrame(
        matrix,
        index=['Actual Normal Risk', 'Actual High Alert'],
        columns=['Pred Normal Risk', 'Pred High Alert'],
    )
LOG_DIR = Path('logs') / 'risk_high_alert'
train_writer = tf.summary.create_file_writer(str(LOG_DIR / 'train'))
val_writer = tf.summary.create_file_writer(str(LOG_DIR / 'validation'))


def log_epoch_metrics(epoch, train_metrics, val_metrics):
    with train_writer.as_default():
        tf.summary.scalar('loss', train_metrics['loss'], step=epoch)
        tf.summary.scalar('accuracy', train_metrics['accuracy'], step=epoch)
        tf.summary.scalar('precision_high_alert', train_metrics['precision_high_alert'], step=epoch)
        tf.summary.scalar('recall_high_alert', train_metrics['recall_high_alert'], step=epoch)
        tf.summary.scalar('f1_high_alert', train_metrics['f1_high_alert'], step=epoch)

    with val_writer.as_default():
        tf.summary.scalar('loss', val_metrics['loss'], step=epoch)
        tf.summary.scalar('accuracy', val_metrics['accuracy'], step=epoch)
        tf.summary.scalar('precision_high_alert', val_metrics['precision_high_alert'], step=epoch)
        tf.summary.scalar('recall_high_alert', val_metrics['recall_high_alert'], step=epoch)
        tf.summary.scalar('f1_high_alert', val_metrics['f1_high_alert'], step=epoch)

    train_writer.flush()
    val_writer.flush()
def train_one_epoch(model, dataset, optimizer):
    losses = []
    all_y_true = []
    all_y_prob = []

    for batch_inputs, batch_target in dataset:
        with tf.GradientTape() as tape:
            predictions = model(batch_inputs, training=True)
            loss = custom_binary_crossentropy_loss(batch_target, predictions)

        gradients = tape.gradient(loss, model.trainable_variables)
        optimizer.apply_gradients(zip(gradients, model.trainable_variables))

        losses.append(float(loss.numpy()))
        all_y_true.append(batch_target.numpy())
        all_y_prob.append(predictions.numpy())

    y_true = np.concatenate(all_y_true).reshape(-1)
    y_prob = np.concatenate(all_y_prob).reshape(-1)
    metrics = binary_metrics_from_arrays(y_true, y_prob, threshold=DEFAULT_PREDICTION_THRESHOLD)
    metrics['loss'] = float(np.mean(losses))
    return metrics


def validate_one_epoch(model, dataset, threshold=DEFAULT_PREDICTION_THRESHOLD):
    losses = []
    all_y_true = []
    all_y_prob = []

    for batch_inputs, batch_target in dataset:
        predictions = model(batch_inputs, training=False)
        loss = custom_binary_crossentropy_loss(batch_target, predictions)
        losses.append(float(loss.numpy()))
        all_y_true.append(batch_target.numpy())
        all_y_prob.append(predictions.numpy())

    y_true = np.concatenate(all_y_true).reshape(-1)
    y_prob = np.concatenate(all_y_prob).reshape(-1)
    metrics = binary_metrics_from_arrays(y_true, y_prob, threshold=threshold)
    metrics['loss'] = float(np.mean(losses))
    return metrics


def train_model(model, train_dataset, validation_dataset, epochs=EPOCHS, learning_rate=LEARNING_RATE):
    optimizer = keras.optimizers.Adam(learning_rate=learning_rate)
    history_rows = []

    for epoch in range(1, epochs + 1):
        train_metrics = train_one_epoch(model, train_dataset, optimizer)
        val_metrics = validate_one_epoch(model, validation_dataset)
        log_epoch_metrics(epoch, train_metrics, val_metrics)

        row = {'epoch': epoch}
        row.update({f'train_{key}': value for key, value in train_metrics.items() if key != 'confusion_matrix'})
        row.update({f'val_{key}': value for key, value in val_metrics.items() if key != 'confusion_matrix'})
        history_rows.append(row)

        print(
            f"Epoch {epoch:03d} | "
            f"train_acc={train_metrics['accuracy']:.4f} | "
            f"val_acc={val_metrics['accuracy']:.4f} | "
            f"val_precision={val_metrics['precision_high_alert']:.4f} | "
            f"val_recall={val_metrics['recall_high_alert']:.4f} | "
            f"val_f1={val_metrics['f1_high_alert']:.4f}"
        )

    return pd.DataFrame(history_rows)


history = train_model(model, train_ds, val_ds)
display(history.tail())
import os
import sys
from pathlib import Path

tensorboard_exe = Path(sys.executable).parent / "Scripts" / "tensorboard.exe"
os.environ["TENSORBOARD_BINARY"] = str(tensorboard_exe)

# (kalau blank buka aja localhost port sesuai dengan yang diatas misal http://localhost:6008/)
def predict_dataframe(model, dataframe):
    inputs = {
        'numeric_features': dataframe[NUMERICAL_FEATURES].astype('float32').to_numpy(),
        'province': dataframe['province'].astype(str).to_numpy(),
        'city': dataframe['city'].astype(str).to_numpy(),
    }
    return model.predict(inputs, verbose=0).reshape(-1)


def tune_threshold(y_true, y_prob):
    rows = []
    for threshold in np.linspace(0.05, 0.95, 181):
        metrics = binary_metrics_from_arrays(y_true, y_prob, threshold=threshold)
        rows.append({
            'threshold': metrics['threshold'],
            'accuracy': metrics['accuracy'],
            'precision_high_alert': metrics['precision_high_alert'],
            'recall_high_alert': metrics['recall_high_alert'],
            'f1_high_alert': metrics['f1_high_alert'],
        })

    threshold_table = pd.DataFrame(rows)
    best_accuracy = threshold_table.sort_values(['accuracy', 'f1_high_alert'], ascending=False).iloc[0].to_dict()
    best_f1 = threshold_table.sort_values(['f1_high_alert', 'accuracy'], ascending=False).iloc[0].to_dict()
    return threshold_table, best_accuracy, best_f1


val_prob = predict_dataframe(model, val_df)
test_prob = predict_dataframe(model, test_df)
y_val = val_df[ALERT_TARGET].to_numpy()
y_test = test_df[ALERT_TARGET].to_numpy()

threshold_table, best_accuracy_threshold, best_f1_threshold = tune_threshold(y_val, val_prob)
SELECTED_THRESHOLD = float(best_accuracy_threshold['threshold'])

default_test_metrics = binary_metrics_from_arrays(y_test, test_prob, threshold=DEFAULT_PREDICTION_THRESHOLD)
selected_test_metrics = binary_metrics_from_arrays(y_test, test_prob, threshold=SELECTED_THRESHOLD)
f1_threshold_test_metrics = binary_metrics_from_arrays(y_test, test_prob, threshold=float(best_f1_threshold['threshold']))

summary_metrics = pd.DataFrame([
    {'scenario': 'Default threshold 0.50', **{key: value for key, value in default_test_metrics.items() if key != 'confusion_matrix'}},
    {'scenario': 'Best validation accuracy threshold', **{key: value for key, value in selected_test_metrics.items() if key != 'confusion_matrix'}},
    {'scenario': 'Best validation F1 threshold', **{key: value for key, value in f1_threshold_test_metrics.items() if key != 'confusion_matrix'}},
])

display(summary_metrics)
print('Best validation accuracy threshold:')
display(pd.DataFrame([best_accuracy_threshold]))
print('Best validation F1 threshold:')
display(pd.DataFrame([best_f1_threshold]))
print('Confusion matrix selected threshold:')
display(confusion_matrix_dataframe(selected_test_metrics))
def to_builtin(value):
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.floating):
        return float(value)
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, dict):
        return {str(key): to_builtin(item) for key, item in value.items()}
    if isinstance(value, list):
        return [to_builtin(item) for item in value]
    return value


model.save(MODEL_PATH)

metadata = {
    'model_name': 'Deep Learning Tabular Binary Classification for Disaster High Alert',
    'created_at': datetime.now().isoformat(timespec='seconds'),
    'dataset_path': str(DATA_PATH),
    'target_source': TARGET,
    'target': ALERT_TARGET,
    'target_rule': f'Normal Risk = 0 if risk_score <= {HIGH_ALERT_THRESHOLD}; High Alert = 1 if risk_score > {HIGH_ALERT_THRESHOLD}',
    'features': {
        'numerical': NUMERICAL_FEATURES,
        'categorical': CATEGORICAL_FEATURES,
    },
    'split_sizes': {
        'train': len(train_df),
        'validation': len(val_df),
        'test': len(test_df),
    },
    'class_distribution': {
        'all': df[ALERT_LABEL].value_counts().to_dict(),
        'train': train_df[ALERT_LABEL].value_counts().to_dict(),
        'validation': val_df[ALERT_LABEL].value_counts().to_dict(),
        'test': test_df[ALERT_LABEL].value_counts().to_dict(),
    },
    'majority_baseline_accuracy': majority_baseline_accuracy,
    'default_prediction_threshold': DEFAULT_PREDICTION_THRESHOLD,
    'selected_threshold': SELECTED_THRESHOLD,
    'best_validation_accuracy_threshold': best_accuracy_threshold,
    'best_validation_f1_threshold': best_f1_threshold,
    'test_metrics_default_threshold': default_test_metrics,
    'test_metrics_selected_threshold': selected_test_metrics,
    'test_metrics_best_f1_threshold': f1_threshold_test_metrics,
    'tensorboard_log_dir': str(LOG_DIR),
}

METADATA_PATH.write_text(json.dumps(to_builtin(metadata), indent=2), encoding='utf-8')

print(f'Model saved to: {MODEL_PATH}')
print(f'Metadata saved to: {METADATA_PATH}')
def make_recommendation(risk_level, probability):
    if risk_level == 'High Alert':
        return 'Risiko tinggi. Perlu pemantauan intensif dan kesiapan respons wilayah.'
    return 'Risiko normal. Tetap lakukan pemantauan rutin terhadap cuaca dan laporan wilayah.'


def prepare_single_payload(payload):
    required_inputs = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
    missing_inputs = [column for column in required_inputs if column not in payload]
    if missing_inputs:
        raise ValueError(f'Input wajib belum lengkap: {missing_inputs}')

    row = pd.DataFrame([payload]).copy()
    for column in NUMERICAL_FEATURES:
        row[column] = pd.to_numeric(row[column], errors='raise')
    for column in CATEGORICAL_FEATURES:
        row[column] = row[column].astype(str).str.strip().str.upper()
    row['quarter'] = ((row['month'].astype(int) - 1) // 3 + 1).astype('int32')
    return row


def predict_high_alert_single(payload, threshold=SELECTED_THRESHOLD):
    row = prepare_single_payload(payload)
    inputs = {
        'numeric_features': row[NUMERICAL_FEATURES].astype('float32').to_numpy(),
        'province': row['province'].astype(str).to_numpy(),
        'city': row['city'].astype(str).to_numpy(),
    }
    probability = float(model.predict(inputs, verbose=0).reshape(-1)[0])
    risk_level = 'High Alert' if probability >= threshold else 'Normal Risk'
    return {
        'risk_probability': probability,
        'risk_level': risk_level,
        'threshold': float(threshold),
        'recommendation': make_recommendation(risk_level, probability),
    }


sample_payload = test_df.iloc[0][NUMERICAL_FEATURES + CATEGORICAL_FEATURES].to_dict()
predict_high_alert_single(sample_payload)
FASTAPI_SCAFFOLD = """
from pathlib import Path
import json
import numpy as np
import pandas as pd
import tensorflow as tf
from fastapi import FastAPI
from pydantic import BaseModel

MODEL_PATH = Path('models/disaster_risk_high_alert_model.keras')
METADATA_PATH = Path('models/disaster_risk_high_alert_metadata.json')

metadata = json.loads(METADATA_PATH.read_text(encoding='utf-8'))
model = tf.keras.models.load_model(MODEL_PATH, compile=False)

NUMERICAL_FEATURES = metadata['features']['numerical']
CATEGORICAL_FEATURES = metadata['features']['categorical']
THRESHOLD = float(metadata['selected_threshold'])

app = FastAPI(title='Disaster High Alert Prediction API')

class PredictionRequest(BaseModel):
    curah_hujan_mm: float
    suhu_rata2_c: float
    suhu_max_c: float
    suhu_min_c: float
    kelembaban_persen: float
    hujan_akumulasi_7d_mm: float
    hari_kering_berturut: float
    province: str
    city: str
    month: int
    quarter: int
    freq_bencana: float


def make_recommendation(risk_level):
    if risk_level == 'High Alert':
        return 'Risiko tinggi. Perlu pemantauan intensif dan kesiapan respons wilayah.'
    return 'Risiko normal. Tetap lakukan pemantauan rutin terhadap cuaca dan laporan wilayah.'

@app.post('/predict')
def predict(payload: PredictionRequest):
    row = pd.DataFrame([payload.model_dump()])
    row['province'] = row['province'].astype(str).str.strip().str.upper()
    row['city'] = row['city'].astype(str).str.strip().str.upper()
    row['quarter'] = ((row['month'].astype(int) - 1) // 3 + 1).astype('int32')

    inputs = {
        'numeric_features': row[NUMERICAL_FEATURES].astype('float32').to_numpy(),
        'province': row['province'].astype(str).to_numpy(),
        'city': row['city'].astype(str).to_numpy(),
    }
    probability = float(model.predict(inputs, verbose=0).reshape(-1)[0])
    risk_level = 'High Alert' if probability >= THRESHOLD else 'Normal Risk'
    return {
        'risk_probability': probability,
        'risk_level': risk_level,
        'threshold': THRESHOLD,
        'recommendation': make_recommendation(risk_level),
    }
"""

print(FASTAPI_SCAFFOLD)
