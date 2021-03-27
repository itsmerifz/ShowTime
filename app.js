let hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']

function setWaktu(){
    let tanggal = new Date()
    let jam = tanggal.getHours().toLocaleString('id-ID',{minimumIntegerDigits: 2})
    let menit = tanggal.getMinutes().toLocaleString('id-ID',{minimumIntegerDigits: 2})
    let detik = tanggal.getSeconds().toLocaleString('id-ID',{minimumIntegerDigits: 2})
    let tgl = tanggal.getDate().toLocaleString('id-ID',{minimumIntegerDigits: 2})
    let bulan = tanggal.toLocaleString('id-ID', { month : 'long' })
    let tahun = tanggal.getFullYear()

    let setJam = jam + " : " +menit+" : "+detik
    const setTanggal = hari[tanggal.getDay()]+', '+ tgl+" "+bulan+" "+tahun

    document.getElementById('jam').innerHTML = setJam
    document.getElementById('tanggal').innerHTML = setTanggal

    setTimeout('setWaktu()',1000)
}

setWaktu()
