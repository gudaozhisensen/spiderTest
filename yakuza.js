let axios = require('axios');
let urllib = require('url');
let cheerio = require('cheerio');
const fs = require('fs');
let puppeteer = require('puppeteer');
let {fsWrite,fsRead,fsDir} = require('./lcfs');

let debugOptions = {
    //设置视窗的宽高
    defaultViewport:{
        width:1400,
        height:800
    },
    //设置为有界面，如果为true，即为无界面
    headless:false,
    //设置放慢每个步骤的毫秒数
    slowMo:250,
    timeout:0
}
let options={headless:true};


let count = 1;
let httpUrl = "http://www.1kkk.com/manhua40946/";
let hostUrl = "http://www.1kkk.com/"
let chapterList = [];

//将延迟函数封装成promise对象
function lcWait(milliSecondes){
    return new Promise(function(resolve,reject){
        setTimeout(function(){
            resolve("成功执行延迟函数，延迟："+milliSecondes)
        },milliSecondes)
    })
}

async function getPageData() {
   let pageHtml =  await axios.get(httpUrl);
   $ = cheerio.load(pageHtml.data,{decodeEntities: false});
   let browser = await puppeteer.launch(debugOptions);
   let tempc = $('a.block').each(async(item,i)=>{
    //    let chapterList = await getChaptersList(item);
    // test 
    getMhImages('http://www.1kkk.com/ch39-924334/#ipg2');

        // console.log(i.children[0].data);
        // chapterList = JSON.stringify(chapterList, null, 2);
        // console.log(chapterList);
   });

async function getChaptersList(index){
    let pageHtml = await axios.get(httpUrl);
    $ = cheerio.load(pageHtml.data,{decodeEntities: false});
    
    let arrUrl = [];
    //拿到连载和番外等列表的长度
    //根据列表分类循环拿到分类下的li数据 
    let num =1
    let length = $('.detail-list-select').eq(index).find('li a').length;
    let page = await browser.newPage();      
    await page.goto(httpUrl);
    $('.detail-list-select').eq(index).find('li a').each(async(item,i)=> {
        
        let chapterUrl = $(i).attr('href');
        chapterUrl = urllib.resolve(hostUrl,chapterUrl);
          
        //获取text文本数据但不包括子元素的文本
        //章节名
        let chapterNumber = $(i).children()[0].prev.data;
        //获取总页数
        let totalPage = $(i).find('span').text();
       
        
       
        // 获取每章的漫画页
        // let mhImages = await getMhImages(chapterUrl);
        // mhImages = JSON.stringify(mhImages, null, 2);
        let obj ={
            url: chapterUrl,
            chapter:chapterNumber,
            pages:totalPage,
            // images:mhImages
        };
        
        chapterList.push(obj);
        num++;
        
        
        if(num==length){
            page.close();
            return chapterList;
        }
        
    })
   
  }

//获得图片
async function getMhImages(url){
    let pageHtml = await axios.get(url);
    $ = cheerio.load(pageHtml.data,{decodeEntities: false});
    let page = await browser.newPage();
    let reg = [];
     // 网站图片请求的js语句;
    await page.setRequestInterception(true);
        //监听请求事件，并对请求进行拦截
        page.on('request', interceptedRequest => {
            //通过URL模块对请求的地址进行解析
            let urlObj = urllib.parse(interceptedRequest.url());
            if (urlObj.pathname.indexOf("galileo")!=-1){
                //如果是广告请求，那么就放弃当次请求
                interceptedRequest.abort();
            }else if(urlObj.pathname.indexOf("chapterfun")!=-1){
                reg.push(urlObj.href);
                interceptedRequest.continue();
            }else{
                interceptedRequest.continue();
            }
            
            
        });
    await page.goto(url);
    await page.goto(reg[0]);
    document.getElementsByTagName('pre')[0].innerText;//?
    let pageDetalList = await page.$eval('pre',(element)=>{
        let text = element.html();
        console.log(element);
    })
    // page.close();
    return pageDetalList;
//     let chapterImgList = [];
//      // 每一章的页码
//    let imgLength = $('.chapterpager').eq(0).find('a').last().text();
// //    console.log(imgLength);
//    let chapterUrl ='/ch39-924334-p'+count+'/';
//    chapterUrl = urllib.resolve(hostUrl,chapterUrl);
//    let chapterImgUrl = reg[count-2];
//    imagesName = 'ch39-924334-p'+count;
//    let obj ={
//        url: chapterUrl,
//        img:chapterImgUrl,
//        name:imagesName
//    };
//    chapterImgList.push(obj);
//    count++;
//     if(count == imgLength){
//         count = 0;
        
//         // downLoad(chapterImgUrl,imagesName);
//         // console.log(chapterImgUrl);
//         // console.log(imagesName);
//        }
        
   
    // return chapterImgList;
 }

async function downLoad(chapterImgUrl,imagesName){
    axios.get(chapterImgUrl, {responseType:'stream'}).then(function(res){
        let ws = fs.createWriteStream('./comics/'+imagesName+".jpg");
        res.data.pipe(ws)      
    });
}

}
getPageData();
