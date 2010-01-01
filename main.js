var friendTimelineUrl = 'https://api.twitter.com/1/statuses/home_timeline.json'
var highestId = false;

var mentionRegex = /@([^.,?!\s]+)/g
var urlRegex = /([a-zA-Z]*:\/\/\S+[^.,?!\s])/g
var hashRegex = /#([^.,?!\s]+)/g

var tweetListElement;
var debug;

//---- Main -------------------------------------------------------------------

function init(container, debug_container)
{
    var markAsReadButton = $('<a href=\'\'>Mark all as read</a>')
        .attr('id', 'mark_as_read');
    markAsReadButton.click(function(){markAllAsRead(); return false;});

    var statusSubmit = $('<input type="submit" id="status_update_submit" value="tweet"/>');
    statusSubmit.click(onSubmit)

    var updateForm = $('<form />')
        .attr('id', 'status_update_form')
        .attr('target', 'post')
        .attr('action', 'http://twitter.com/statuses/update.xml')
        .attr('method', 'post')
        .append(
            '<textarea rows="2" id="status_text" name="status"></textarea>')
        .append('<div id="chars_left" />')
        .append(statusSubmit);

    tweetListElement = $('<ul />').attr('id', 'tweet_list');

    container.empty();
    container.append(markAsReadButton);
    container.append(updateForm);
    container.append(tweetListElement);
    container.append('<div style="clear: both;" />');

    $('#status_text').keyup(updateStatus).keyup();

    debug = $('<pre />');

    debug_container.append('debug');
    debug_container.append(debug);

    update();
}

function update()
{
    setTimeout(update, 2 * 60 * 1000)
    getTweets();
}

function insertTweets(tweets)
{
    // reverse order
    tweets.sort(function (a, b) { return b.id - a.id });
    if(tweets.length > 0 && (!highestId || tweets[0].id > highestId))
        highestId = tweets[0].id;

    var maxi = 0;
    var read = getRead();
    while(maxi != tweets.length && tweets[maxi].id > read)
        maxi = maxi + 1;
    maxi = maxi + 50;
    if(maxi > tweets.length)
        maxi = tweets.length

    // merge into tweets list
    var i = 0;
    var element = tweetListElement.children().eq(0);
    while(i != maxi)
    {
        if(element.length == 0)
        {
            debug.append('appending ' + tweets[i].id + ' to end<br/>');
            tweetListElement.append(tweetTemplate(tweets[i]));
            i = i + 1;
        }
        else if(tweets[i].id > element.attr("id").substring(6)*1)
        {
            debug.append('inserting ' + tweets[i].id + ' before ' +
                         element.attr("id").substring(6)*1 + '<br/>');
            element.before(tweetTemplate(tweets[i]));
            i = i + 1;
        }
        else if(tweets[i].id == element.attr("id").substring(6)*1)
        {
            debug.append('skipping ' + tweets[i].id + '<br/>');
            i = i + 1;
        }
        else
        {
            element = element.next();
        }
    }
}

function getTweets()
{
    debug.empty();
    debug.append('getting tweets. . .<br />');
    debug.append('highest id: ' + highestId + '<br />');

    var url = friendTimelineUrl + '?callback=insertTweets'
    if(highestId == false)
        url += '&count=200';
    else
        url += '&count=200&since_id=' + highestId;
    putScriptTag(url);
}

function markAllAsRead()
{
    $('.unread').removeClass('unread');
    setRead(highestId);
}

function onSubmit()
{
    var iframe = $('#post');
    $('#post').load(function (e) {
        getTweets();
        $('#status_text').val("");
        $('#status_text').keyup();
    });
}

//---- Templates --------------------------------------------------------------

function tweetId(id)
{
    return 'tweet_' + id;
}

function tweetTemplate(tweet)
{
    var info = $('<div />')
        .addClass('info')
        .append('<img src="' + tweet.user.profile_image_url + '" />');
    var body = $('<div />')
        .addClass('body')
        .append(tweetAuthorTemplate(tweet.user))
        .append(' ')
        .append(tweetTextTemplate(tweet.text));
    var tweetElement = $('<li />')
        .attr('id', tweetId(tweet.id))
        .addClass('tweet')
        .append(info)
        .append(body);
    if(tweet.id > getRead())
        tweetElement.addClass('unread');
    return tweetElement;
}

function tweetTextTemplate(text)
{
    return $('<span />').addClass('tweet_text')
                        .append(processTweetBody(text));
}

function processTweetBody(body)
{
    body = body.replace(
        urlRegex,
        '<a href="$1" target="_blank">$1</a>');
    body = body.replace(
        mentionRegex,
        '<a href="http://twitter.com/$1" target="_blank">@$1</a>');
    body = body.replace(
        hashRegex,
        '<a href="http://search.twitter.com/search?q=%23$1" target="_blank">#$1</a>');
    return body;
}

function tweetAuthorTemplate(user)
{
    return $('<a />').addClass('tweet_author')
                     .attr('href', 'http://twitter.com/' + user.screen_name)
                     .append(user.screen_name)
}

//---- Utility ----------------------------------------------------------------

function getRead()
{
    if($.cookie('read') == null)
        setRead(1);

    return $.cookie('read');
}

function setRead(val)
{
    $.cookie('read', val, {expires: 30});
}

function putScriptTag(url)
{
    $('head').append('<script type="text/javascript" src="' + url + '" />');
}

function updateStatus()
{
    var lim = 100;
    var i = 0;
    while (i++ < lim && this.rows > 2 && this.scrollHeight <= this.offsetHeight)
        this.rows--;
    i = 0;
    while (i++ < lim && this.scrollHeight > this.offsetHeight)
        this.rows++;

    $('#chars_left').empty();
    if(this.value.length > 0)
        $('#chars_left').append(140 - this.value.length);
}
