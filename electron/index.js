'use strict'

// catch unhandled promise rejections
require('electron-unhandled')()

// start the code
require('./ui')


//const ent = require('../server/ent')
const { load, setEntResults } = require('./graph')
const ent = require('../server/ent')
const hybridfinder = require('../server/hybridfinder')
// Got these from rnning MrBayes with 200,000 generations 
let emydura_newick = '{"name":"","branchset":[{"name":"","branchset":[{"name":"","branchset":[{"name":"Emydura_subglobosa__KC755190","length":0.0213557},{"name":"Emydura_subglobosa__KC755185","length":0.0213557}],"length":0.01697965},{"name":"","branchset":[{"name":"","branchset":[{"name":"Emydura_tanybaraga__KC755187","length":0.002130279},{"name":"Emydura_tanybaraga__KC755186","length":0.002130279}],"length":0.005879958},{"name":"Emydura_subglobosa__KC755184","length":0.008010237}],"length":0.03032511}],"length":0.02363264},{"name":"","branchset":[{"name":"","branchset":[{"name":"Emydura_victoriae__KC755189","length":0.0009329163},{"name":"Emydura_victoriae__KC755188","length":0.0009329163}],"length":0.02354606},{"name":"Emydura_macquarii__KC755183","length":0.02447898}],"length":0.03748901}]}'
let coyote_newick = '{"branchset":[{"name":"","branchset":[{"name":"","branchset":[{"name":"","branchset":[{"name":"Canis_latrans__EU400576","length":0.01034633},{"name":"","branchset":[{"name":"Canis_latrans__EU400575","length":0.004728678},{"name":"Canis_latrans__EU400568","length":0.004728678},{"name":"Canis_latrans__EU400566","length":0.004728678},{"name":"Canis_latrans__EU400557","length":0.004728678},{"name":"Canis_latrans__EU400549","length":0.004728678},{"name":"Canis_latrans__EU400544","length":0.004728678}],"length":0.005617651}],"length":0.002874451},{"name":"","branchset":[{"name":"","branchset":[{"name":"Canis_latrans__EU400574","length":0.006305685},{"name":"Canis_latrans__EU400573","length":0.006305685},{"name":"Canis_latrans__EU400569","length":0.006305685},{"name":"Canis_latrans__EU400553","length":0.006305685},{"name":"Canis_latrans__EU400550","length":0.006305685},{"name":"Canis_latrans__EU400548","length":0.006305685}],"length":0.004338519},{"name":"","branchset":[{"name":"","branchset":[{"name":"Canis_latrans__EU400572","length":0.006717904},{"name":"","branchset":[{"name":"Canis_latrans__EU400567","length":0.003824248},{"name":"Canis_latrans__EU400565","length":0.003824248},{"name":"Canis_latrans__EU400564","length":0.003824248},{"name":"Canis_latrans__EU400562","length":0.003824248},{"name":"Canis_latrans__EU400560","length":0.003824248},{"name":"Canis_latrans__EU400547","length":0.003824248}],"length":0.002893656},{"name":"Canis_latrans__EU400563","length":0.006717904},{"name":"","branchset":[{"name":"Canis_latrans__EU400558","length":0.0007330588},{"name":"Canis_latrans__EU400551","length":0.0007330588}],"length":0.005984845},{"name":"Canis_latrans__EU400556","length":0.006717904},{"name":"Canis_latrans__EU400555","length":0.006717904},{"name":"Canis_latrans__EU400546","length":0.006717904},{"name":"Canis_latrans__EU400545","length":0.006717904}],"length":0.001895911},{"name":"","branchset":[{"name":"Canis_latrans__EU400571","length":0.002911124},{"name":"Canis_latrans__EU400552","length":0.002911124}],"length":0.00570269}],"length":0.00203039}],"length":0.002576576}],"length":0.004938734},{"name":"","branchset":[{"name":"","branchset":[{"name":"Canis_latrans__EU400570","length":0.002703287},{"name":"Canis_latrans__EU400561","length":0.002703287},{"name":"Canis_latrans__EU400559","length":0.002703287}],"length":0.002016564},{"name":"Canis_latrans__EU400554","length":0.004719851}],"length":0.01343966}],"length":0.01087622},{"name":"","branchset":[{"name":"","branchset":[{"name":"","branchset":[{"name":"","branchset":[{"name":"Canis_latrans__EU400578","length":0.003427445},{"name":"Canis_latrans__EU400577","length":0.003427445}],"length":0.004524789},{"name":"","branchset":[{"name":"Canis_lupus__AF115701","length":0.00248638},{"name":"","branchset":[{"name":"Canis_lupus__AF115700","length":0.001004047},{"name":"Canis_lupus__AF115699","length":0.001004047}],"length":0.001482333}],"length":0.005465853}],"length":0.002087985},{"name":"Canis_lupus__AF115698","length":0.01004022}],"length":0.002715496},{"name":"","branchset":[{"name":"Canis_lupus__AF115703","length":0.001591692},{"name":"Canis_lupus__AF115702","length":0.001591692}],"length":0.01116402},{"name":"Canis_lupus__AF115697","length":0.01275571},{"name":"","branchset":[{"name":"Canis_lupus__AF115696","length":0.004640228},{"name":"","branchset":[{"name":"Canis_lupus__AF115695","length":0.00230793},{"name":"Canis_lupus__AF115694","length":0.00230793}],"length":0.002332298}],"length":0.008115486},{"name":"","branchset":[{"name":"","branchset":[{"name":"Canis_lupus__AF115693","length":0.001873817},{"name":"Canis_lupus__AF115692","length":0.001873817}],"length":0.00723324},{"name":"","branchset":[{"name":"","branchset":[{"name":"Canis_lupus__AF115691","length":0.002896728},{"name":"Canis_lupus__AF115690","length":0.002896728}],"length":0.004483875},{"name":"","branchset":[{"name":"Canis_lupus__AF115689","length":0.002097011},{"name":"","branchset":[{"name":"Canis_lupus__AF115688","length":0.0004788006},{"name":"Canis_lupus__AF115687","length":0.0004788007}],"length":0.001618211}],"length":0.005283591}],"length":0.001726454}],"length":0.003648658}],"length":0.01628002}],"name":""}'
let trio_newick = '{"branchset":[{"name":"","branchset":[{"name":"","branchset":[{"name":"","branchset":[{"name":"","branchset":[{"name":"Apalone_ferox__AY259555","length":0.04428022},{"name":"","branchset":[{"name":"Apalone_spinifera__AY259557","length":0.03013677},{"name":"Apalone_spinifera__AY259558","length":0.03013677}],"length":0.01414345}],"length":0.0190812},{"name":"Apalone_mutica__AY259556","length":0.06336142}],"length":0.08983394},{"name":"","branchset":[{"name":"Pelochelys_bibroni__AY259559","length":0.04766159},{"name":"","branchset":[{"name":"Pelochelys_cantorii__AY259560","length":0.02016654},{"name":"Pelochelys_cantorii__JN232533","length":0.02016654}],"length":0.02749505}],"length":0.1055338}],"length":0.01804174},{"name":"","branchset":[{"name":"","branchset":[{"name":"Dogania_subplana__AY259551","length":0.1156762},{"name":"","branchset":[{"name":"","branchset":[{"name":"","branchset":[{"name":"Nilssonia_formosa__AY259547","length":0.000715196},{"name":"Nilssonia_formosa__HE801741","length":0.0007151961}],"length":0.001039483},{"name":"Nilssonia_formosa__HE801740","length":0.001754679}],"length":0.08576736},{"name":"Palea_steindachneri__AY743417","length":0.08752204}],"length":0.02815416}],"length":0.02554001},{"name":"","branchset":[{"name":"Palea_steindachneri__AY259552","length":0.1160475},{"name":"","branchset":[{"name":"Pelodiscus_axenaria__AY583693","length":0.05142666},{"name":"","branchset":[{"name":"","branchset":[{"name":"Pelodiscus_maackii__AB904720","length":0.002587226},{"name":"Pelodiscus_maackii__AB904721","length":0.002587226}],"length":0.01160813},{"name":"","branchset":[{"name":"Pelodiscus_sinensis__AB904726","length":0.001254552},{"name":"Pelodiscus_sinensis__AB904727","length":0.001254552}],"length":0.01294081}],"length":0.0372313}],"length":0.06462083}],"length":0.02516872}],"length":0.03002089}],"length":0.1133319},{"name":"","branchset":[{"name":"Cyclanorbis_elegans__AY259570","length":0.1357415},{"name":"","branchset":[{"name":"Cyclanorbis_senegalensis__AY259569","length":0.01262677},{"name":"Cyclanorbis_senegalensis__FR850654","length":0.01262677}],"length":0.1231147}],"length":0.1488275}],"name":""}'

let newick = JSON.parse(coyote_newick)

//let entResults = ent.strictSearch(newick,null)
let entResults = hybridfinder.search(newick)
load(newick)
setEntResults(entResults)
document.querySelector('#phylogram').hidden = false

//let newick_test = JSON.parse('{"name":"","branchset":[{"name":"","branchset":[{"name":"","branchset":[{"name":"Emydura_subglobosa__KC755190","length":0.02344209},{"name":"Emydura_subglobosa__KC755185","length":0.02344209}],"length":0.01758622},{"name":"","branchset":[{"name":"","branchset":[{"name":"Emydura_tanybaraga__KC755187","length":0.002094315},{"name":"Emydura_tanybaraga__KC755186","length":0.002094315}],"length":0.005813882},{"name":"Emydura_subglobosa__KC755184","length":0.007908197}],"length":0.03312011}],"length":0.02121316},{"name":"","branchset":[{"name":"","branchset":[{"name":"Emydura_victoriae__KC755189","length":0.001143005},{"name":"Emydura_victoriae__KC755188","length":0.001143005}],"length":0.02748866},{"name":"Emydura_macquarii__KC755183","length":0.02863167}],"length":0.0336098}]}')
/*let alignedFasta = `>Emydura_subglobosa__KC755190
-ggaacaataaattatcacctcaaaagacacataaaaccacaggaaccccta-ctcaacc
ataaaaaacacaaatccactattaaaaatcattaacaacacctttattgatctccccacc
ccatctaacatctctactttatgaaactttggttcattactaggggcatgcctcattcta
caactagccacaggaatcttcttagctatacactactcatctgatatttccatagcattc
tcatcaatctcccacatccaacgagacgttcaatatggctgactaattcgaaatatacac
gctaacggtgcttcattattctttatatgcatttacctccatattggacgaggaatctac
tacggttcatacctttacaagaaaacctgaaacactggagtaatattactactcctagtc
atagccactgcattcgtgggctacgtactaccatgaggacaaatatcattctgaggagct
acagtaatcaccaatctcctatcagccattccatatgtaggccctacacttgtagaatga
atttgaggggggttctccgtagataacgccacccttacccgattctttacattccacttc
ctaatcccattcgccatcctaggaat---aactatactacatctactactacta------
--------------catgaaacaggatcaaacaacccaaca----ggactaaactcaaac
tgtgacaaaatcccattccacccatatttctcctataaagatctactaggccttattcta
ataataacactcctactcacccttaccctattctaccctaacctactaggagatccagac
aactttacaccagccaacccactaaccacc
>Emydura_victoriae__KC755189
ggaacaatcaattattaccccacaaagacacataaaaccacaggaacccctactccaacc
ataaaaaacacaaatccactattaaaaatcattaacaacaccttcgttgatcttcccacc
ccatccaacatctccgctttatgaaacttcggatcattactaggagcatgcctcattcta
caactagccacaggaatcttcttagctatacactactcatccgacatttctacagcattc
tcatcaatttcccacatccaacgagatgttcaatatggatgacttattcgaaatatacac
gccaacggtgcttcattattctttatatgcatctaccttcatattggacgagggatctac
tacggttcctacctttacaacaaaacctgaaacactggagtaatattactactcctagtt
atagccactgcattcgtgggctacgtgctaccatgaggccaaatatcattctgaggggct
acagtaatcaccaacctattatcagccattccatacgtaggcccaacacttgtagagtgg
atttgaggagggttctccgtagacaacgctactcttactcgattcttcacatttcacttt
ctaatcccattcgccatcctaggaat---aaccctactacacctcctacttcta------
--------------cacgaaacaggatcaaacaacccaaca----ggactaaactcaaac
tgtgacaaaatcccattccacccatatttctcgtataaagacctactaggcctcatccta
ataattatatgtctactcacccttaccctatttcacccaaacctactaggagatccagac
aactttacaccagccaatccactaaccacc
>Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaagacacataaaaccacaggaacctctactccaacc
ataaaaaacacaaatccactattaaaaatcattaacaacaccttcgttgatcttcccacc
ccatccaacatctccgctttatgaaacttcggatcattactaggagcatgcctcattcta
caactagccacaggaatcttcttagctatacactactcatccgacatttctacagcattc
tcatcaatttcccacatccaacgagatgttcaatatggatgacttattcgaaatatacac
gccaacggtgcttcattattctttatatgcatctaccttcatattggacgagggatctac
tacggttcctacctttacaacaaaacctgaaacactggagtaatattactactcctagtt
atagccactgcattcgtgggctacgtgctaccatgaggccaaatatcattctgaggggct
acagtaatcaccaacctattatcagccattccatacgtaggcccaacacttgtagagtgg
atttgaggagggttctccgtagacaacgctactcttactcgattcttcacatttcacttt
ctaatcccattcgccatcctaggaat---aaccctactacacctcctacttcta------
--------------cacgaaacaggatcaaacaacccaaca----ggactaaactcaaac
tgtgacaaaatcccattccacccatatttctcgtataaagacctactaggcctcatccta
ataattatatgtctactcacccttaccctatttcacccaaacctactaggagatccagac
aactttacaccagccaatccactaaccacc
>Emydura_tanybaraga__KC755187
-ggaacaataa--attatccccaaaagacacataaaactacaggaa-cccctactcaacc
ataaaaaacacaaacccactactaaaaatcattaataatacctttattgatctccccact
ccacctaacatctccgctttgtgaaactttggatcattactaggggcatgcctcgctcta
caactagccacaggaatcttcttagcgatacactactcatccgatatctccatagcattc
tcatcaatctcccacatccaacgagatgttcaatatggctgactaattcgaaatatacac
gccaacggtgcttcattattctttatatgcatttacctccatattggacgaggaatttac
tacggttcatatctttacaacaaaacctgaaacactggggtaatattactactcctagtc
atagccactgcattcgtgggatacgtactaccatgaggacaaatatcattctgaggagct
acagtaatcaccaatctcttatcagccattccatacgtaggccctacacttgtagagtga
atctgagggggattctccgtagatagtgctacccttactcgattcttcacattccacttt
ctaatcccattcgctatcctagggat---aactatactacatctactactgcta------
--------------catgaaacaggatcaaacaacccaaca----ggactaaactcaaac
tgtgacaaaatcccattccacccatatttctcttataaagatctactaggcctcattctg
ataatcacacttctactcactcttaccctattctaccccaacctactaggagacccagac
aactttacaccagccaacccactaaccacc
>Emydura_tanybaraga__KC755186
-ggaacaataa--attatccccaaaagacacataaaactacaggaa-cccctactcaacc
ataaaaaacacaaacccactattaaaaatcattaataatacctttattgacctccccact
ccacctaacatctccgctttgtgaaactttggatcattactaggggcatgcctcgctcta
caactagccacaggaatcttcttagcgatacactactcatccgatatctccatagcattc
tcatcaatctcccacatccaacgagatgttcaatatggctgactaattcgaaatatacac
gccaacggtgcttcattattctttatatgcatttacctccatattggacgaggaatttac
tacggttcatatctttacaacaaaacctgaaacactggggtaatattactactcctagtc
atagccactgcattcgtgggatacgtactaccatgaggacaaatatcattctgaggagct
acagtaatcaccaatctattatcagccattccatacgtaggccctacacttgtagagtga
atctgagggggattctccgtagatagtgctacccttactcgattcttcacattccacttt
ctaatcccattcgctatcctagggat---aactatactacatctactattgcta------
--------------catgaaacaggatcaaacaacccaaca----ggactaaactcaaac
tgtgacaaaatcccattccacccatatttctcttataaagatctactaggcctcattctg
ataatcacacttctactcactcttaccctattctaccccaacctactaggagacccagac
aactttacaccagccaacccactaaccacc
>Emydura_subglobosa__KC755185
-ggaacaataaattaccaccccaaaagacacataaaaccacaggaacccctaccccaacc
ataaaaaacacaaatccactattaaaaatcattaacaataccttcattgacctccccacc
ccatctaacatctccgctctatgaaactttgggtcattactaggggcatgccttattcta
caactagccacaggaatcttcttagctatacactactcatccgacatttccatagcattc
tcatcaatctcccacatccaacgagacgttcaatatggctgactaattcgaaatatacac
gctaacggtgcttcattattctttatatgcatttacctccatattgggcgaggaatttac
tacggttcatacctttacaagaaaacttgaaacactggagtaatattactactcctagta
atagccactgcattcgtgggctacgtactaccatgaggacaaatatcattctgaggggct
acagtaatcactaatcttctatcagccattccatatgtaggccctacacttgtagaatga
atttgaggaggattctccgtagataacgccacccttacccgattctttacattccacttt
ctaatcccattcgccatcctgggaat---aactatactacatctactactacta------
--------------catgaaacaggatcaaataacccaaca----ggactaaactcaaac
tgtgacaaaatcccattccacccatatttctcttataaagacctactaggccttattcta
ataatcacactcctactcacccttaccctgttctaccccaacctactaggagacccagac
aactttacaccagccaacccactgaccacc
>Emydura_subglobosa__KC755184
-ggaacaataaattacctccccaaaagacacataaaactacaggaacccctacctcaacc
ataaaaaacacaaacccactattaaaaatcattaataatacctttattgatctccccact
ccacctaacatctccgctttgtgaaactttggatcattactaggggcatgcctcgctcta
caactagccacaggaatcttcttagcgatacactactcatctgatatctccatagcattc
tcatcaatctcccacatccaacgagatgttcaatatggctgactaattcgaaatatacac
gccaacggtgcttcattattctttatatgcatttacctccatattggacgaggaatttac
tacggttcatacctttacaacaaaacctgaaacactggggtaatattactactcctagtc
atagccactgcattcgtgggatacgtactaccatgaggacaaatatcattctgaggagct
acagtaatcaccaacctcttatcagccattccatacgtaggccctacacttgtagagtga
atctgagggggattctccgtagatagtgctacccttactcgattcttcacattccacttt
ctaatcccattcgctatcctagggat---aactatactacatctactactgcta------
--------------catgaaacaggatcaaacaacccaaca----ggactaaactcaaac
tgtgacaaaatcccattccacccatatttctcttataaagatctactaggcctcattctg
ataatcacacttctactcactcttaccctattctaccccaacctactaggagacccagac
aactttacaccagccaacccactaaccacc
>Emydura_macquarii__KC755183
-ggaacaatcaattattacccacaaagacacataaaaccacaggaacctctactccaacc
ataaaaaacacaaatccactattaaaaatcattaataacacctttgttgatcttcccacc
ccatccaatatctccgccttatgaaacttcggatcattactaggggcatgcctcattcta
caactagccacaggaattttcttagccatacactactcatccgacatttctacagcattc
tcatcaatttcccacatccaacgagatgttcaatatggatgacttattcgaaatatacac
gccaacggtgcttcattattctttatatgcatctaccttcatattggacgaggaatctat
tacggttcctacctttacaataaaacctgaaacactggagtaatattactactactagtc
atagccactgcattcgtaggctacgtactaccatgaggccaaatatcattctgaggggct
acagtaatcaccaacctattatcagccatcccatacgtaggcccaacacttgtagagtga
atttgaggagggttctccgtagacaacgccacccttactcgattcttcacatttcacttt
ctaatcccattcgccatcctaggaat---aaccctactacacctcctacttcta------
--------------cacgaaacaggatcaaataacccaaca----ggactaaactcaaac
tgtgacaaaatcccattccacccatatttctcgtataaagacctactaggactcatccta
ataatcatatgtctacttaccctcaccctattttacccaaacctactaggagatccagac
aactttacaccagccaatccactaaccact
>Emydura_signata__AF113624.1
------------------------------------------------------------
---------------------------aggagtga-----------------tgcctgcc
cagtgaca------ctgtttaacggccgcggtatcctgac--------------------
------------------------------------------------------------
---------------------------------------------------------cgt
gcgaaggtagcgtaatcactcgtcttttaaataaagactagaatga------atggctaa
acgaggttctatctgtctcttac-------aaacaatcagtgaaattgatccccccgtgc
aaa---------agcgagg-----ataaccccataagacgagaagacc--ctgtggaact
ttaagtatgagtca-------------------------------------------tca
ccattaaccaactactcaacagaaaacactactc--ataaccttcctgacttttaacttt
cggttggggcga--cctcggagaaaaataaaacctccgaaaactactactaagataatac
aaacctaagtgcctacggcaaaacgatccaatacacttgatcgacgaaccaagctacccc
agggataacagcgcaatcccctcttagagtccatatcaatgac---gggggtttacgacc
tcgatgttggatcag------gacaccctaatggtgcagccgctattaagggttc-----
------------------------------`
*/
//let output = ent.strictSearch(newick_test, alignedFasta)