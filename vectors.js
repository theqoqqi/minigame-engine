
// Вычисляет разницу между двумя векторами
function subtractVectors(a, b) {
    return {
        x: a.x - b.x,
        y: a.y - b.y
    };
}

// Вычисляет сумму векторов
function addVectors(a, b) {
    return {
        x: a.x + b.x,
        y: a.y + b.y
    };
}

// Проверяет равны ли векторы
function isVectorsEquals(a, b) {
    return a.x === b.x && a.y === b.y;
}

// Проверяет все ли векторы равны в массиве
function isAllVectorsEquals(vectors) {
    let first = vectors[0];

    for (const vector of vectors) {
        if (!isVectorsEquals(first, vector)) {
            return false;
        }
    }
    return true;
}

// Расстояние между векторами
function distanceBetweenVectors(from, to) {
    let distance = subtractVectors(from, to);

    return getVectorLength(distance);
}

// Направление от вектора к вектору
function directionBetweenVectors(from, to) {
    let distance = subtractVectors(from, to);

    return normalizeVector(distance);
}

// Вычисляет длину вектора
function getVectorLength(c) {

    return Math.sqrt(c.x ** 2 + c.y ** 2);
}

// Нормализует вектор
function normalizeVector(c) {
    let vectorLength = getVectorLength(c);

    return {
        x: c.x / vectorLength,
        y: c.y / vectorLength
    };
}

// Увеличивает вектор во сколько-то
function scaleVector(v, scaleBy) {
    return {
        x: v.x * scaleBy,
        y: v.y * scaleBy
    };
}
